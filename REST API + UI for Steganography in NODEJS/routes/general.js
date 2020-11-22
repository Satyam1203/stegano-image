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
        await image.writeAsync('./imagesAfterEncoding/' + file.filename + ".png")
        resolve(file.filename + ".png")
        fs.unlinkSync('./imagesToBeEncoded/' + file.filename)
    })
}

steg.hideImage = (file1, file2) => {
    return new Promise(async (resolve, reject) => {

        let parentImage = await jimp.read('./imagesToBeEncoded/' + file1.filename)
        let data1 = parentImage.bitmap.data.toJSON().data
        let imageToBeHidden = await jimp.read('./imagesToBeEncoded/' + file2.filename)
        let data2 = imageToBeHidden.bitmap.data.toJSON().data

        data2.map((px, idx) => {
            let hideMSBBinary = px.toString(2)
            while(8 - hideMSBBinary.length)
                hideMSBBinary = "0" + hideMSBBinary
            hideMSBBinary = hideMSBBinary.slice(0,4);

            data1[idx] = data1[idx].toString(2);
            while(8 - data1[idx].length)
                data1[idx] = "0" + data1[idx]

            data1[idx] = data1[idx].slice(0,4) + hideMSBBinary;
            data1[idx] = parseInt(data1[idx], 2);
        })

        let diff = data1.length - data2.length;
        while(diff--) {
            let i = data1.length - diff;
            data1[i] = parseInt(data1[i]).toString(2)
            while(8 - data1[i].length)
                data1[i] = "0" + data1[i]

            data1[i] = parseInt((data1[i].slice(0,4) + '0000'), 2);
        }

        parentImage.bitmap.data = Buffer.from(data1)
        await parentImage.writeAsync('./imagesAfterEncoding/' + file1.filename + ".png")
        resolve(file1.filename + ".png")
        fs.unlinkSync('./imagesToBeEncoded/' + file1.filename)
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