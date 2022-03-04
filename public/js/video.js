
let files = {}
function handleVideo(type, e) {
    console.log(e.target.files[0])
    if (!e.target.files[0])
        return
    files[type] = e.target.files[0]
    if (type == "image") {
        let img = document.querySelector('.video img')
        img.setAttribute('src', URL.createObjectURL(e.target.files[0]))
    } else {
        let video, close
        if (type == 'video'){
            video = document.querySelector('.video video')
            close = document.querySelector('.video label button')
        }
        else{
            video = document.querySelector('.decode-video video')
            close = document.querySelector('.decode-video label button')
        }

        close.style.display = "inline-block"
        video.style.display = "block"
        video.setAttribute('src', URL.createObjectURL(e.target.files[0]))
    }
}

const removeVideo = (e, type) => {
    e.stopPropagation()
    console.log(e)
    let video, close
    if (type == 'decode'){
        video = document.querySelector('.decode-video video')
        close = document.querySelector('.decode-video button')
    }
    else{
        video = document.querySelector('.video video')
        close = document.querySelector('.video button')
    }

    video.setAttribute('src', "")
    video.style.display = 'none'
    close.style.display = "none"
}
function sendVideo(type) {
    if ((type == 'encode' && (!files.image || !files.video)) ||
        (type == 'decode' && !files['decode-video'])) {
        alert("No image or video selected")
        return
    }
    let loading = document.querySelector('#loading')
    loading.style.display = "flex"
    let formData = new FormData()
    if (type == 'encode') {
        formData.append("files", files.video)
        formData.append("files", files.image)
        formData.append("userId", userId)
    } else {
        formData.append("files", files['decode-video'])
        formData.append("userId", userId)
    }

    var instance = axios.create({
        validateStatus: function (status) {
             return status == 200;
         },
     });

    instance({
        method: "POST",
        url: "/steg-encode-video",
        // url: type == "encode" ? "/steg-encode-video" : "/steg-decode-video",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(result => {
        console.log(result)
    }).catch((err, msg) => {
        alert("something went wrong")
        loading.style.display = "none"
    })
}