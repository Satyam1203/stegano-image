const jimp = require("jimp");
const fs = require("fs");
const { encodeVideo } = require("./encode-video");
const { connected } = require("process");

let steg = {};

steg.encodeVideo = encodeVideo;

steg.encode = (msg, file) => {
  return new Promise(async (resolve, reject) => {
    try {
      let image = await jimp.read("./imagesToBeEncoded/" + file.filename);
      let data = image.bitmap.data.toJSON().data;
      let charBinaryArray = [];
      msg.split("").map((char) => {
        let binaryString = char.charCodeAt().toString(2);
        while (7 - binaryString.length) binaryString = "0" + binaryString;
        charBinaryArray.push(...binaryString.split(""));
      });
      charBinaryArray.push(...["0", "0", "0", "0", "0", "1", "1"]);

      charBinaryArray.map((bit, i) => {
        if (bit == "1") data[i] |= bit;
        else if (data[i] & 1) --data[i];
      });
      image.bitmap.data = Buffer.from(data);
      await image.writeAsync("./imagesAfterEncoding/" + file.filename + ".png");
      resolve(file.filename + ".png");
      fs.unlinkSync("./imagesToBeEncoded/" + file.filename);
    } catch (error) {
      resolve({
        status: "failed",
        msg: "Some problem ocurred. Please try again.",
      });
    }
  });
};

steg.hideImage = (file1, file2) => {
  return new Promise(async (resolve, reject) => {
    try {
      let parentImage = await jimp.read(
        "./imagesToBeEncoded/" + file1.filename
      );
      let data1 = parentImage.bitmap.data.toJSON().data;
      let imageToBeHidden = await jimp.read(
        "./imagesToBeEncoded/" + file2.filename
      );
      let data2 = imageToBeHidden.bitmap.data.toJSON().data;

      // console.log(data1.length, data2.length);
      // // TODO: Handle image sizing issues from backend instead of frontend. (REJECT IF data1.length < data2.length + 4)
      if (data1.length < data2.length + 4) {
        resolve({
          status: "failed",
          msg: "The image you want to hide should be smaller in size",
        });
        return;
      }
      let width = imageToBeHidden.getWidth().toString(2);
      while (16 - width.length) width = "0" + width;

      let height = imageToBeHidden.getHeight().toString(2);
      while (16 - height.length) height = "0" + height;

      data1[0] = parseInt(width.slice(0, 8), 2);
      data1[1] = parseInt(width.slice(8, 16), 2);
      data1[2] = parseInt(height.slice(0, 8), 2);
      data1[3] = parseInt(height.slice(8, 16), 2);

      data2.map((px, idx) => {
        let hideMSBBinary = px.toString(2);
        while (8 - hideMSBBinary.length) hideMSBBinary = "0" + hideMSBBinary;
        hideMSBBinary = hideMSBBinary.slice(0, 4);

        data1[idx + 4] = data1[idx + 4].toString(2);
        while (8 - data1[idx + 4].length) data1[idx + 4] = "0" + data1[idx + 4];

        data1[idx + 4] = data1[idx + 4].slice(0, 4) + hideMSBBinary;
        data1[idx + 4] = parseInt(data1[idx + 4], 2);
      });

      // TODO: Check whether not doing this has effect on decoded image or any other error.

      // let diff = data1.length - data2.length - 4;
      // while(diff > 0) {
      //     let i = data1.length - diff;
      //     data1[i] = parseInt(data1[i]).toString(2)
      //     while(8 - data1[i].length)
      //         data1[i] = "0" + data1[i]

      //     data1[i] = parseInt((data1[i].slice(0,4) + '0000'), 2);
      // }

      parentImage.bitmap.data = Buffer.from(data1);
      await parentImage.writeAsync(
        "./imagesAfterEncoding/" + file1.filename + ".png"
      );
      resolve({ status: "success", url: file1.filename + ".png" });
      fs.unlinkSync("./imagesToBeEncoded/" + file1.filename);
      fs.unlinkSync("./imagesToBeEncoded/" + file2.filename);
    } catch (error) {
      resolve({
        status: "failed",
        msg: "Some problem ocurred. Please try again.",
      });
    }
  });
};

steg.retrieveImage = (file) => {
  // TODO: Error Handling for non-decodable image. Add try-catch
  return new Promise(async (resolve, reject) => {
    try {
      let image = await jimp.read("./imagesToBeDecoded/" + file.filename);
      let data = image.bitmap.data.toJSON().data;

      let widthPart2 = data[1].toString(2);
      while (8 - widthPart2.length) widthPart2 = "0" + widthPart2;

      let width = data[0].toString(2) + widthPart2;
      width = parseInt(width, 2);

      let heightPart2 = data[3].toString(2);
      while (8 - heightPart2.length) heightPart2 = "0" + heightPart2;

      let height = data[2].toString(2) + heightPart2;
      height = parseInt(height, 2);

      // TODO: Check whether is there a problem if whole data array is parsed instead of just required size
      data.map((px, idx) => {
        if (idx >= 4) {
          let getMSB = px.toString(2);
          while (8 - getMSB.length) getMSB = "0" + getMSB;
          getMSB = getMSB.slice(4) + "0000";
          data[idx - 4] = parseInt(getMSB, 2);
        }
      });

      image.bitmap.data = Buffer.from(data);
      image.bitmap.width = width;
      image.bitmap.height = height;
      await image.writeAsync("./imagesAfterDecoding/" + file.filename + ".png");
      resolve({ status: "success", url: file.filename + ".png" });
      fs.unlinkSync("./imagesToBeDecoded/" + file.filename);
    } catch (error) {
      resolve({ status: "failed", msg: "image has no hidden data" });
    }
  });
};

steg.decode = (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      let image = await jimp.read("./imagesToBeDecoded/" + file.filename);
      let data = image.bitmap.data.toJSON().data;

      let char = "";
      let msg = "";
      for (let bit of data) {
        char += bit & 1;
        if (char.length == 7) {
          if (char == "0000011") break;
          msg += String.fromCharCode(parseInt(char, 2));
          char = "";
        }
      }
      resolve(msg);
      fs.unlinkSync("./imagesToBeDecoded/" + file.filename);
    } catch (error) {
      resolve({
        status: "failed",
        msg: "Some problem ocurred. Please try again.",
      });
    }
  });
};

module.exports = steg;
