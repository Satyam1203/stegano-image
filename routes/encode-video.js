const jimp = require('jimp')
const fs = require('fs-extra')
const util = require('util')
const { v4: uuidV4 } = require('uuid')
const exec = util.promisify(require('child_process').exec)
const videoEncoder = 'libx264'

const processFrame = async (frame, image) => {
  let parentImage = frame
  let imageToBeHidden = image
  let offSet = 0;

  let data1 = parentImage.bitmap.data.toJSON().data
  let data2 = imageToBeHidden.bitmap.data.toJSON().data

  // TODO: Handle image sizing issues from backend instead of frontend. (REJECT IF data1.length < data2.length + 4)
  // console.log('data1', data1.length, '\n', data1, '\n')
  // console.log('data2', data2.length, '\n', data2)
  if (data1.length < data2.length + offSet) {
    return undefined
  }

  // console.log('frame ', frame.getWidth(), ' ', frame.getHeight())
  // console.log('frame ', image.getWidth(), ' ', image.getHeight())

  // let width = imageToBeHidden.getWidth().toString(2)
  // while (24 - width.length > 0) width = '0' + width

  // let height = imageToBeHidden.getHeight().toString(2)
  // while (24 - height.length > 0) height = '0' + height
  // console.log("line 30 ", width, " ", height)
  // data1[0] = parseInt(width.slice(3, 10) + '1', 2)
  // data1[1] = parseInt(width.slice(10, 17) + '1', 2)
  // data1[2] = parseInt(width.slice(17, 24) + '1', 2)

  // data1[4] = parseInt(height.slice(3, 10) + '1', 2)
  // data1[5] = parseInt(height.slice(10, 17) + '1', 2)
  // data1[6] = parseInt(height.slice(17, 24) + '1', 2)

  data2.map((px, idx) => {
    if((idx+1)%4 != 0) {
      let hideMSBBinary = px.toString(2)
      while (8 - hideMSBBinary.length > 0) hideMSBBinary = '0' + hideMSBBinary
      hideMSBBinary = hideMSBBinary.slice(0, 4)
  
      data1[idx + offSet] = data1[idx + offSet].toString(2)
      while (8 - data1[idx + offSet].length > 0) data1[idx + offSet] = '0' + data1[idx + offSet]
  
      data1[idx + offSet] = data1[idx + offSet].slice(0, 4) + hideMSBBinary
      data1[idx + offSet] = parseInt(data1[idx + offSet], 2)
    } 
    
  })
  // console.log('data1 after steg', data1.length, '\n', data1, '\n')

  parentImage.bitmap.data = Buffer.from(data1)
  return parentImage
}

const extractImage = async (frame, count, path, fileName) => {
  let width = parseInt(fileName.match(/_.[0-9]*/g)[0].slice(1))
  let height = parseInt(fileName.match(/_.[0-9]*/g)[1].slice(1))
  // console.log(fileName, " ", width, " ", height)

  try {
    let image = frame
    let data = image.bitmap.data.toJSON().data

    // let widthPart3 = data[2].toString(2).slice(0,7)
    // let widthPart2 = data[1].toString(2).slice(0,7)
    // // while (8 - widthPart2.length) widthPart2 = '0' + widthPart2
    // let width = data[0].toString(2).slice(0,7) + widthPart2 + widthPart3
    // width = parseInt(width, 2)

    // let heightPart3 = data[6].toString(2).slice(0,7)
    // let heightPart2 = data[5].toString(2).slice(0,7)
    // // while (8 - heightPart2.length) heightPart2 = '0' + heightPart2
    // let height = data[4].toString(2) + heightPart2 + heightPart3
    // height = parseInt(height, 2)

    // TODO: Check whether is there a problem if whole data array is parsed instead of just required size
    // console.log(width, ' ', height)
    // console.log('steg-frame data', data.length, data)

    let extractedData = [], loops = width*height*4
    for(let idx = 0; extractedData.length < loops; ++idx) {
      let getMSB = data[idx].toString(2)
      while (8 - getMSB.length) getMSB = '0' + getMSB
      if((idx+1)%4) getMSB = getMSB.slice(4) + '0000' // removes first 4 from the string
      else getMSB = "11111111"
      extractedData.push(parseInt(getMSB, 2))
    }
    // console.log('extracted data', extractedData.length, extractedData)
    // data.map((px, idx) => {
    //   if (idx > 7 ) {
    //     let getMSB = px.toString(2)
    //     while (8 - getMSB.length) getMSB = '0' + getMSB
    //     getMSB = getMSB.slice(4) + '0000' // removes first 4 from the string
    //     extractedData.push(parseInt(getMSB, 2))
    //     if(extractedData.length >= width*height*4) break
    //   }
    // })

    image.bitmap.data = Buffer.from(extractedData)
    image.bitmap.width = width
    image.bitmap.height = height
    await image.writeAsync('./imagesAfterDecoding/' + path + count + '.png')
    return { status: 'success', url: path + count + '.png' }
  } catch (error) {
    return { status: 'failed', msg: 'image has no hidden data' }
  }
}
const encodeVideo = (video, image) => {
  return new Promise(async (resolve, reject) => {
    const path = uuidV4()
    try {
      // console.log(image)
      // console.log('yu', video)
      let extractedImage
      console.log('initialization')

      if(!fs.existsSync(`frames`)) await fs.mkdir(`frames`)
      await fs.mkdir(`frames/${path}`)
      await fs.mkdir(`frames/${path}/raw-frames`)
      await fs.mkdir(`frames/${path}/processed-frames`)
      // await fs.mkdir(`frames/processed-frames/${path}`)

      console.log('decoding')

      let t1 = Date.now()

      await exec(
        `ffmpeg -i videosToBeEncoded/${video.filename} frames/${path}/raw-frames/%d.png`,
      )

      let t2 = Date.now()

      console.log((t2 - t1) / (1000 * 60), 'minutes')

      console.log('rendering')

      // const frames = fs.readdirSync(`frames/${path}/raw-frames`)

      // for(let count = 1; count <= frames.length; count++) {
      let count = 1
      let frame = await jimp.read(`frames/${path}/raw-frames/${count}.png`)

      // if(count === 1) {
      let dimensions
      if (image) {
        let jimpImage = await jimp.read(`videosToBeEncoded/${image.filename}`)
        dimensions = "_" + jimpImage.getWidth() + '_' + jimpImage.getHeight() + "_"
        frame = await processFrame(frame, jimpImage)
        if (!frame) {
          throw 'The image you want to hide should be smaller than the frame of the video in size'
        }
      } else {
        extractedImage = await extractImage(frame, count, path, video.filename)
      }
      // }
      if (image) {
        fs.unlinkSync(`frames/${path}/raw-frames/${count}.png`)
        await frame.writeAsync(`frames/${path}/raw-frames/${count}.png`)
        // fs.unlinkSync(`frames/${path}/processed-frames/${count}.png`)
        // await frame.writeAsync(`frames/${path}/processed-frames/${count}.png`)
      }
      // }
      t1 = Date.now()
      console.log((t1 - t2) / (1000 * 60), 'minutes')
      if (image) {
        console.log('encoding')

        // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -refs 1 -crf 0 -preset ultrafast frames/${path}/${video.filename}`)
        await exec(
          `ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -refs 1 -crf 0 frames/${path}/${video.filename}`,
        )

        // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -crf 0 frames/${path}/${video.filename}`)

        // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -c:v libx264 -qp 0 -f mp4 frames/${path}/${video.filename}`)

        t2 = Date.now()
        console.log((t2 - t1) / (1000 * 60), 'minutes')

        console.log('Adding Audio')
        await exec(
          `ffmpeg -i frames/${path}/${video.filename} -i videosToBeEncoded/${video.filename} -c copy -map 0:v:0 -map 1:a:0 videosAfterEncoding/${dimensions + video.filename}`,
        )

        t1 = Date.now()
        console.log((t1 - t2) / (1000 * 60), 'minutes')

        console.log('done')

        fs.removeSync(`frames/${path}`)
        fs.unlinkSync(`videosToBeEncoded/${video.filename}`)
        fs.unlinkSync(`videosToBeEncoded/${image.filename}`)
        resolve({ status: 'video', url: dimensions + video.filename, dimensions: dimensions})
      } else {
        console.log('done')

        fs.removeSync(`frames/${path}`)
        fs.unlinkSync(`videosToBeEncoded/${video.filename}`)
        resolve({ status: 'image', url: path + 1 + '.png'})
      }
    } catch (err) {
      console.log(err)
      fs.removeSync(`frames/${path}`)
      if (video) fs.unlinkSync(`videosToBeEncoded/${video.filename}`)
      if (image) fs.unlinkSync(`videosToBeEncoded/${image.filename}`)
      resolve({ status: 'failed', msg: "server error" })
    }
  })
}

module.exports = { encodeVideo }
