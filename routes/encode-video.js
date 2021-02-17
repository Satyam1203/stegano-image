const jimp = require('jimp')
const fs = require('fs-extra')
const util = require('util')
const { v4: uuidV4 } = require('uuid')
const exec = util.promisify(require('child_process').exec)
const videoEncoder = 'libx264'

const processFrame = async (frame, count, image) => {
    let parentImage = frame
    let data1 = parentImage.bitmap.data.toJSON().data
    let imageToBeHidden = image
    let data2 = imageToBeHidden.bitmap.data.toJSON().data

    // TODO: Handle image sizing issues from backend instead of frontend. (REJECT IF data1.length < data2.length + 4)
    if (data1.length < data2.length + 4) {
        resolve({ status: 'failed', msg: "The image you want to hide should be smaller in size" })
        return
    }
    let width = imageToBeHidden.getWidth().toString(2)
    while (16 - width.length)
        width = "0" + width

    let height = imageToBeHidden.getHeight().toString(2)
    while (16 - height.length)
        height = "0" + height

    data1[0] = parseInt(width.slice(0, 8), 2)
    data1[1] = parseInt(width.slice(8, 16), 2)
    data1[2] = parseInt(height.slice(0, 8), 2)
    data1[3] = parseInt(height.slice(8, 16), 2)

    data2.map((px, idx) => {
        let hideMSBBinary = px.toString(2)
        while (8 - hideMSBBinary.length)
            hideMSBBinary = "0" + hideMSBBinary
        hideMSBBinary = hideMSBBinary.slice(0, 4);

        data1[idx + 4] = data1[idx + 4].toString(2);
        while (8 - data1[idx + 4].length)
            data1[idx + 4] = "0" + data1[idx + 4]

        data1[idx + 4] = data1[idx + 4].slice(0, 4) + hideMSBBinary;
        data1[idx + 4] = parseInt(data1[idx + 4], 2);
    })

    // TODO: Check whether not doing this has effect on decoded image or any other error.

    // let diff = data1.length - data2.length - 4;
    // while(diff > 0) {
    //     let i = data1.length - diff;
    //     data1[i] = parseInt(data1[i]).toString(2)
    //     while(8 - data1[i].length)
    //         data1[i] = "0" + data1[i]

    //     data1[i] = parseInt((data1[i].slice(0,4) + '0000'), 2);
    // }


    parentImage.bitmap.data = Buffer.from(data1)
    return parentImage
}

const extractImage = async (frame, count, path) => {
    try {
        let image = frame
        let data = image.bitmap.data.toJSON().data

        let widthPart2 = data[1].toString(2)
        while (8 - widthPart2.length) widthPart2 = '0' + widthPart2

        let width = data[0].toString(2) + widthPart2
        width = parseInt(width, 2);

        let heightPart2 = data[3].toString(2)
        while (8 - heightPart2.length) heightPart2 = '0' + heightPart2

        let height = data[2].toString(2) + heightPart2
        height = parseInt(height, 2);

        // TODO: Check whether is there a problem if whole data array is parsed instead of just required size
        data.map((px, idx) => {
            if (idx >= 4) {
                let getMSB = px.toString(2)
                while (8 - getMSB.length)
                    getMSB = "0" + getMSB
                getMSB = getMSB.slice(4) + '0000';
                data[idx - 4] = parseInt(getMSB, 2)
            }
        })

        image.bitmap.data = Buffer.from(data)
        image.bitmap.width = width
        image.bitmap.height = height
        await image.writeAsync('./imagesAfterDecoding/' + path + count + ".png")
        return ({ status: "success", url: path + count + ".png" })
    } catch (error) {
        return ({ status: "failed", msg: "image has no hidden data" })
    }
}
const encodeVideo = (video, image) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(image)
            let extractedImage
            console.log("initialization")

            const path = uuidV4()

            await fs.mkdir(`frames/${path}`)
            await fs.mkdir(`frames/${path}/raw-frames`)
            await fs.mkdir(`frames/${path}/processed-frames`)
            // await fs.mkdir(`frames/processed-frames/${path}`)

            console.log("decoding")

            let t1 = Date.now()

            await exec(`ffmpeg -i videosToBeEncoded/${video.filename} frames/${path}/raw-frames/%d.png`)

            let t2 = Date.now()

            console.log((t2 - t1) / (1000 * 60), "minutes")

            console.log('rendering')

            // const frames = fs.readdirSync(`frames/${path}/raw-frames`)

            // for(let count = 1; count <= frames.length; count++) {
            let count = 1
            let frame = await jimp.read(`frames/${path}/raw-frames/${count}.png`)

            // if(count === 1) {
            if (image) {
                let jimpImage = await jimp.read(`videosToBeEncoded/${image.filename}`)
                frame = await processFrame(frame, count, jimpImage)
            } else {
                extractedImage = await extractImage(frame, count, path)
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
            console.log((t1 - t2) / (1000 * 60), "minutes")
            if (image) {
                console.log('encoding')

                // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -refs 1 -crf 0 -preset ultrafast frames/${path}/${video.filename}`)
                await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -refs 1 -crf 0 frames/${path}/${video.filename}`)

                // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -vcodec ${videoEncoder} -profile:v high444 -crf 0 frames/${path}/${video.filename}`)

                // await exec(`ffmpeg -start_number 1 -i frames/${path}/raw-frames/%d.png -c:v libx264 -qp 0 -f mp4 frames/${path}/${video.filename}`)

                t2 = Date.now()
                console.log((t2 - t1) / (1000 * 60), "minutes")

                console.log("Adding Audio")
                await exec(`ffmpeg -i frames/${path}/${video.filename} -i videosToBeEncoded/${video.filename} -c copy -map 0:v:0 -map 1:a:0 videosAfterEncoding/${video.filename}`)

                t1 = Date.now()
                console.log((t1 - t2) / (1000 * 60), "minutes")

                console.log("done")

                fs.removeSync(`frames/${path}`)
                fs.unlinkSync(`videosToBeEncoded/${video.filename}`)
                fs.unlinkSync(`videosToBeEncoded/${image.filename}`)
                resolve({ status: "video", url: video.filename })
            } else {
                console.log("done")

                fs.removeSync(`frames/${path}`)
                fs.unlinkSync(`videosToBeEncoded/${video.filename}`)
                resolve({ status: "image", url: path + 1 + ".png" })
            }

        } catch (err) {
            console.log(err)
            resolve({ status: "failed", msg: "something went wrong" })
        }
    })
}

module.exports = { encodeVideo }