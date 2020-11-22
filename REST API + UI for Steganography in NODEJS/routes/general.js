const jimp = require('jimp')

let steg = {}

steg.encode = (msg, file) => {
    return new Promise(async (resolve, reject) => {

        let image = await jimp.read('./imagesToBeEncoded/' + file.filename)
        let data = image.bitmap.data.toJSON().data
        let charBinaryArray = []
        msg.split("").map(char => {
            let binaryString = char.charCodeAt().toString(2)
            while(7 - binaryString.length)
                binaryString = "0" + binaryString
            charBinaryArray.push(...binaryString.split(""))
        })
        charBinaryArray.push(...['1', '0', '0', '0', '0', '1', '1'])

        charBinaryArray.map((bit, i) => {
            if (bit == "1")
                data[i] |= bit
            else if (data[i] & 1)
                --data[i]
        })
        image.bitmap.data = Buffer.from(data)
        let someData = await image.writeAsync('./imagesAfterEncoding/' + file.filename)
        resolve(file.filename)
    })


}

steg.retrieveImage = (file) => {

    return new Promise(async (resolve, reject) => {
        let image = await jimp.read('./imagesToBeDecoded/' + file.filename)
        let data = image.bitmap.data.toJSON().data

        // console.log(data)

        data.map((px,idx) => {
            let getMSB = px.toString(2)
            while(8 - getMSB.length)
                getMSB = "0" + getMSB
            getMSB = getMSB.slice(4) + '0000';
            data[idx] = parseInt(getMSB, 2)
        })

        image.bitmap.data = Buffer.from(data)
        await image.writeAsync('./imagesAfterDecoding/' + file.filename + ".png")
        resolve(file.filename + ".png")
    })

}

steg.decode = (file) => {
    return new Promise(async (resolve, reject) => {
        let image = await jimp.read('./imagesToBeDecoded/' + file.filename)
        let data = image.bitmap.data.toJSON().data

        let char = ""
        let msg = ""
        for (let bit of data) {
            char += bit & 1
            if (char.length == 7) {
                if (char == "1000011")
                    break
                msg += String.fromCharCode(parseInt(char, 2))
                char = ""
            }
        }
        resolve(msg)
    })

}

module.exports = steg