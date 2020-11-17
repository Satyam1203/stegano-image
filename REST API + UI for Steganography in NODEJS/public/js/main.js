let createCard = (type, value, typeOfCard) => {
    let img = document.createElement('img')
    img.setAttribute('src', type == "src" ? value : URL.createObjectURL(value))
    img.classList.add('img')

    let imgWrap = document.createElement('div')
    imgWrap.classList.add('imgContainer')

    if(type == "src") {
        let a = document.createElement('a')
        a.setAttribute('href', value)
        a.setAttribute('download', value)
        a.textContent = "Download"
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

const delay = (type, file) => {
    return new Promise((resolve, reject) => {
        setTimeout((file) => {
            let selectedImages = document.querySelector(".selectedImages")
            let imgWrap = createCard("file", file, type)
            selectedImages.append(imgWrap)
            imgWrap.scrollIntoView()
            resolve()
        }, 200, file);
    })
}

const handleChange = async (type, e) => {

    let form = document.querySelector(".form")
    form.classList.add("activeForm")
    let selectedImages = document.querySelector(".selectedImages")
    let sendBtn = document.querySelector(".send")

    filesToBesteganographed.push(...e.target.files)

    for (let file of e.target.files)
        await delay(type, file)

    selectedImages.scrollTo(0, 0)
    sendBtn.classList.remove("hidden")

}

const send = (type, e) => {
    let loading = document.querySelector('#loading')
    loading.style.display = "flex"
    let formData = new FormData()

    if (type == "encode") {
        let messages = []
        document.querySelectorAll('.selectedImages .msg')
            .forEach(msg => messages.push(msg.value))

        formData.append("messages", messages)
    }

    filesToBesteganographed.map(file => {
        formData.append("files", file)
    })

    axios({
        method: "POST",
        url: type == "encode" ? "/steg-encode" : "/steg-decode",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(result => {

        let selectedImages = document.querySelector(".result")
        while(selectedImages.lastChild)
        selectedImages.removeChild(selectedImages.lastChild)
        
        result.data.map(value => {
            if(type == "encode") {
                let imgWrap = createCard("src", value)
                selectedImages.append(imgWrap)
            } else {
                let p = document.createElement('p')
                p.textContent = value
                selectedImages.append(p)
            }
            loading.style.display = "none"
        })

    })
}

const setTextLimit = (ths) => {
    ths.parentElement.lastChild.maxLength = Math.floor(ths.naturalWidth*ths.naturalHeight*4/7)-2
}

const calc = (ths) => {
    let totCharLeft = ths.maxLength - ths.value.length
    ths.parentElement.children[0].textContent = totCharLeft
}