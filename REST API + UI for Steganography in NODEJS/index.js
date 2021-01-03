const express = require('express')
const app = express()
const path = require('path')

app.use(express.static(path.join(__dirname, 'node_modules/axios')));
app.use(express.static(path.join(__dirname, 'imagesAfterEncoding')));
app.use(express.static(path.join(__dirname, 'imagesAfterDecoding')));
app.use(express.static(path.join(__dirname, 'videosAfterEncoding')));
app.use(express.static(path.join(__dirname, 'public')));

const main = require('./routes/main')
const cors = require('cors')
app.set('view engine', 'ejs')
   
app.use(express.json())
app.use(cors())
app.use(main)

app.get('/steg-encode', (req, res) => {
    res.render('encode.ejs')
})

app.get('/steg-decode', (req, res) => {
    res.render('decode.ejs')
})

app.get('/encode-image', (req, res) => {
    res.render('encode-image.ejs')
})

app.get('/decode-image', (req, res) => {
    res.render('decode-image.ejs')
})

app.get('/encode-video', (req, res) => {
    res.render('encode-video.ejs')
})

// app.get('/decode-video', (req, res) => {
//     res.render('decode-image.ejs')
// })

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log("app is listening on " + PORT)
})