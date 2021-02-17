
let filesToBeSteganographed = {}
function handleChange(type, e) {
    console.log(e.target.files[0])
    filesToBeSteganographed[type] = e.target.files[0]
    let selectedImages = document.querySelector('.selectedImages .' + type)
    selectedImages.textContent = type + " for steganography: " + e.target.files[0].name
}

function send(type) {
    let loading = document.querySelector('#loading')
    loading.style.display = "flex"
    let formData = new FormData()

    formData.append("files", filesToBeSteganographed.video)
    formData.append("files", filesToBeSteganographed.image)

    axios({
        method: "POST",
        url: type == "encode" ? "/steg-encode-video" : "/steg-decode-decode",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    }).then(result => {
        console.log(result)
        if (result.data[0].status == 'video') {
            let video = document.querySelector('video')
            console.log(video)
            const source = document.createElement('source');

            source.setAttribute('src', result.data[0].url);

            video.appendChild(source);
            video.play();
        } else {
            let vid = document.querySelector('.result img')
            vid.src = result.data[0].url
        }
        loading.style.display = "none"
    })
}