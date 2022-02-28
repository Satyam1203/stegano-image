const express = require("express")
const router = express.Router()
const multer = require('multer')
const { v4: uuidV4 } = require('uuid')
const imagesToBeEncoded = multer({ dest: 'imagesToBeEncoded/' })
const imagesToBeDecoded = multer({ dest: 'imagesToBeDecoded/' })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'videosToBeEncoded')
    },
    filename: function (req, file, cb) {
        console.log(file)
        cb(null, uuidV4() + file.originalname)
      }
  })
const videosToBeEncoded = multer({ storage: storage })
const videosToBeDecoded = multer({ storage: storage })

const steg = require('./general')

router.post('/steg-encode', imagesToBeEncoded.array('files'), (req, res) => {

    let promises = []
    req.files.map(async (file, i) => {
        promises.push(steg.encode(req.body.messages.split(',')[i], file))
    })
    Promise.all(promises).then(urls => {
        res.send(urls)
    })

})

router.post('/steg-encode-image', imagesToBeEncoded.array('files'), (req, res) => {

    let promises = []
    // console.log(req.files);
    promises.push(steg.hideImage(req.files[0], req.files[1]));
    Promise.all(promises).then(result => {
            res.send(result)
    })

})

router.post('/steg-decode-image', imagesToBeDecoded.array('files'), (req, res) => {

    let promises = []
    // console.log(req.files);
    promises.push(steg.retrieveImage(req.files[0]));
    Promise.all(promises).then(urls => {
        res.send(urls)
    })

})

router.post('/steg-decode', imagesToBeDecoded.array("files"), (req, res) => {
    let promises = []
    req.files.map(async file => {
        promises.push(steg.decode(file))
    })
    Promise.all(promises).then(msgList => {
        res.send(msgList)
    })
})

router.post('/steg-encode-video', videosToBeEncoded.array('files'), (req, res) => {
    let promises = []
    console.log(req.files);
    promises.push(steg.encodeVideo(req.files[0], req.files[1]));
    Promise.all(promises).then(result => {
            console.log(result)
            res.send(result)
    })
})

module.exports = router