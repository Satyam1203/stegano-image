let socket = io()
let userId = window.crypto.getRandomValues(new Uint32Array(1))[0]

socket.on(userId, data => {
    let loading = document.querySelector('#loading')
    let para = document.querySelector('#loading div')

    if(data.status == 'video_URL') {
        console.log(data.URL)
        let video = document.querySelector('.video .result')
        let label = document.querySelectorAll('.video label')[2]
        label.style.display = "flex"
        video.src = data.URL
        video.style.display = "block"
        loading.style.display = "none"
        para.innerHTML = "<p>Loading</p>" 
    } else if(data.status == 'image_URL') {
        let img = document.querySelector('.decode-video label img')
        img.src = data.URL
        img.parentElement.style.display = 'flex'
        loading.style.display = "none"
        para.innerHTML = "<p>Loading</p>" 
    } else if(data.status == "failed") {
        console.log(data.msg)
        alert(data.msg)
        loading.style.display = "none"
        para.innerHTML = "<p>Loading</p>" 
    } else {
        console.log(data.msg)
        para.innerHTML += "<p>" + data.msg + "</p>"
    }
})