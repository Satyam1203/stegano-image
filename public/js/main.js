let createCard = (type, value, typeOfCard) => {
    let img = document.createElement('img')
    img.setAttribute('src', type == 'src' ? value : URL.createObjectURL(value))
    img.classList.add('img')

    let imgWrap = document.createElement('div')
    imgWrap.classList.add('imgContainer')

    if (type == "src") {
        let a = document.createElement('a')
        a.classList.add('steganoImage')
        a.setAttribute('href', value)
        a.setAttribute('download', value)
        imgWrap.append(a)
    }

    if (typeOfCard == "encode") {
        img.setAttribute('onload', 'setTextLimit(this)')

        let msgInput = document.createElement('textArea')
        msgInput.classList.add('msg')
        msgInput.setAttribute('maxlength', 0)
        msgInput.setAttribute('type', 'text')
        msgInput.setAttribute('onkeypress', 'calc(this)')
        msgInput.setAttribute('placeholder', 'Write your message here ...')

        let span = document.createElement('span')

        imgWrap.append(span)
        imgWrap.append(img)
        imgWrap.append(msgInput)
    } else {
        imgWrap.append(img)
    }

    return imgWrap
}

let filesToBesteganographed = []
let messageFromImageFiles = []
let messageTOImageFiles = []

let imageTOImageFiles = {}
let imageFromImageFiles 


const delay = (type, file) => {
    return new Promise((resolve, reject) => {
        setTimeout((file) => {
            if (type === 'src') {
                let result = document.querySelector(".result")
                let imgWrap = createCard(type, file)
                result.append(imgWrap)
                let img = document.querySelectorAll(".result .img")
                result.scrollTo(img.length * 200, 0)
            } else {
                let selectedImages
                if (type == 'decode') {
                    selectedImages = document.querySelector(".decode .selectedImages")
                } else if (type == 'encode') {
                    selectedImages = document.querySelector(".encode .selectedImages")
                }
                let imgWrap = createCard("file", file, type)
                selectedImages.append(imgWrap)
                let img = selectedImages.querySelectorAll(".img")
                selectedImages.scrollTo(img.length * 200, 0)
            }
            resolve()
        }, 200, file);
    })
}

const handleChange = async (type, e, image) => {

    // if(image){

    //     if(filesToBesteganographed.length == 2) return;
    //     if(filesToBesteganographed.length == 1 && (filesToBesteganographed[0].size - e.target.files[0].size) <= 4) {
    //         alert("Image 2 appears to be larger than image 1. Try another")
    //         return;
    //     }
    // }
    let selectedImages, cursor
    if (type == 'decode') {
        selectedImages = document.querySelector(".decode .selectedImages")
        messageFromImageFiles.push(...e.target.files)
    } else if (type == 'encode') {
        selectedImages = document.querySelector(".encode .selectedImages")
        messageTOImageFiles.push(...e.target.files)
    } else if (type == 'encode-image') {
        if(image == 1) {
            imageTOImageFiles[1] = e.target.files[0]
            let img = document.querySelectorAll('.encode-image label img')[0]
            img.src = URL.createObjectURL(e.target.files[0])
        } else {
            imageTOImageFiles[2] = e.target.files[0]
            let img = document.querySelectorAll('.encode-image label img')[1]
            img.src = URL.createObjectURL(e.target.files[0])
        }
        
    } else {
        imageFromImageFiles = e.target.files[0]
        console.log(imageFromImageFiles, e.target.files[0])
        let img = document.querySelector('.decode-image label img')
        img.src = URL.createObjectURL(e.target.files[0])
    }
    if (selectedImages)
        cursor = selectedImages.scrollLeft

    if (type == 'encode' || type == 'decode')
        for (let file of e.target.files)
            await delay(type, file)

    if (type == 'encode' || type == 'decode') {
        setTimeout(() => {
            selectedImages.scrollTo(0, 0)
            if (cursor)
                selectedImages.scrollTo(cursor, 0)
        }, 400);
    }

}

const send = (type, e) => {
    if ((type == 'encode' && !messageTOImageFiles.length) ||
        (type == 'decode' && !messageFromImageFiles.length)) {
        alert("No image is selected")
        return
    }
    let loading = document.querySelector('#loading')
    loading.style.display = "flex"
    let formData = new FormData()

    if (type == "encode") {
        let messages = []
        document.querySelectorAll('.selectedImages .msg')
            .forEach(msg => messages.push(msg.value))

        formData.append("messages", messages)
        messageTOImageFiles.map(file => {
            formData.append("files", file)
        })
    } else {
        messageFromImageFiles.map(file => {
            formData.append("files", file)
        })
    }



    axios({
        method: "POST",
        url: type == "encode" ? "/steg-encode" : "/steg-decode",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(URLs => {

        let result
        if (type == 'decode') {
            result = document.querySelector(".decode .result")
        } else {
            result = document.querySelector(".encode .result")
        }
        while (result.lastChild)
            result.removeChild(result.lastChild)
        // if (type == "encode") {
        //     let downloadAll = document.querySelector('.download')
        //     if (downloadAll)
        //         document.querySelectorAll('.encode')[1].removeChild(downloadAll)
        //     let div = document.createElement("div")
        //     div.classList.add('download')
        //     div.setAttribute('onclick', 'downloadAll()')
        //     document.querySelectorAll(".encode")[1].prepend(div)
        // }
        URLs.data.map(async value => {
            if (type == "encode") {
                // let imgWrap = createCard("src", value)
                // result.append(imgWrap)
                let cursor = result.scrollLeft
                await delay('src', value)
                setTimeout(() => {
                    result.scrollTo(cursor, 0)
                }, 500);
            } else {
                let p = document.createElement('p')
                p.textContent = value
                result.append(p)
            }
            loading.style.display = "none"
        })

    })
}

const sendImage = (type, e, decodeImage) => {
    let loading = document.querySelector('#loading')
    loading.style.display = "flex"
    let formData = new FormData()
    if (type == 'encode') {
        formData.append("files", imageTOImageFiles[1])
        formData.append("files", imageTOImageFiles[2])
    } else {
        formData.append("files", imageFromImageFiles)
        console.log(imageFromImageFiles)
    }

    axios({
        method: "POST",
        url: type == "encode" ? "/steg-encode-image" : "/steg-decode-image",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(result => {
        console.log(result)
        let selectedImages = document.querySelector(".result")
        while (selectedImages.lastChild)
            selectedImages.removeChild(selectedImages.lastChild)

        result.data.map(result => {
            if (result.status == "success") {
                if (type == "encode") {
                    // let imgWrap = createCard("src", result.url)
                    // selectedImages.append(imgWrap)
                    let img = document.querySelectorAll('.encode-image img')[2]
                    img.parentElement.style.display = "flex"
                    img.setAttribute('src', result.url)
                } else {
                    let img = document.querySelectorAll('.decode-image img')[1]
                    img.parentElement.style.display = "flex"
                    img.setAttribute('src', result.url)
                }
            } else {
                alert(result.msg)
            }

            loading.style.display = "none"
        })

    })
}

const setTextLimit = (ths) => {
    ths.parentElement.lastChild.maxLength = Math.floor(ths.naturalWidth * ths.naturalHeight * 4 / 7) - 2
}

const calc = (ths) => {
    let totCharLeft = ths.maxLength - ths.value.length
    ths.parentElement.children[0].textContent = totCharLeft
}

downloadAll = () => {
    let images = document.querySelectorAll('.steganoImage')
    if (!images.length) {
        alert("No images to download")
        return
    }
    images.forEach(image => {
        image.click()
    })
}

route = (ths, page) => {
    let lists = document.querySelectorAll('.list')
    lists.forEach(ele => {
        ele.classList.remove('active')
    })
    ths.classList.add('active')
    let mainContent = document.querySelector('.mainContent')
    mainContent.scrollTo(0, mainContent.clientHeight * page)
}