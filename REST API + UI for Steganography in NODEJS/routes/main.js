const express = require("express")
const router = express.Router()
const multer = require('multer')
const imagesToBeEncoded = multer({ dest: 'imagesToBeEncoded/' })
const imagesToBeDecoded = multer({ dest: 'imagesToBeDecoded/' })
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

router.post('/steg-decode', imagesToBeDecoded.array("files"), (req, res) => {
    let promises = []
    req.files.map(async file => {
        promises.push(steg.decode(file))
    })
    Promise.all(promises).then(msgList => {
        res.send(msgList)
    })
})

module.exports = router