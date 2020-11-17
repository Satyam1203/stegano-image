const jimp = require('jimp')
const fs = require('fs')

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
        charBinaryArray.push(...['0', '0', '0', '0', '0', '1', '1'])

        charBinaryArray.map((bit, i) => {
            if (bit == "1")
                data[i] |= bit
            else if (data[i] & 1)
                --data[i]
        })
        image.bitmap.data = Buffer.from(data)
        await image.writeAsync('./imagesAfterEncoding/' + file.filename + "." + image.getExtension())
        resolve(file.filename + "." + image.getExtension())
        fs.unlinkSync('./imagesToBeEncoded/' + file.filename)
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
                if (char == "0000011")
                    break
                msg += String.fromCharCode(parseInt(char, 2))
                char = ""
            }
        }
        resolve(msg)
        fs.unlinkSync('./imagesToBeDecoded/' + file.filename)
    })

}

module.exports = steg