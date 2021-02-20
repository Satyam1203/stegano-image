const delayImage = (type, file, filesToBesteganographed) => {
  return new Promise((resolve, reject) => {
    setTimeout(
      (file) => {
        let selectedImages;
        if (type == "decode") {
          selectedImages = document.querySelector(
            ".decode-image .selectedImages"
          );
        } else {
          selectedImages = document.querySelector(
            ".encode-image .selectedImages"
          );
        }
        selectedImages.innerHTML = "";
        if (type === "decode") {
          let imgWrap = createCard("file", file, type, (isImage = 1));
          selectedImages.append(imgWrap);
        } else {
          filesToBesteganographed.forEach((img) => {
            let imgWrap = createCard("file", img, type, (isImage = 1));
            selectedImages.append(imgWrap);
          });
        }
        let img = selectedImages.querySelectorAll(".img");
        selectedImages.scrollTo(img.length * 200, 0);

        resolve();
      },
      200,
      file
    );
  });
};

const handleChangeImage = async (type, e) => {
  let selectedImages;
  if (type == "decode") {
    selectedImages = document.querySelector(".decode-image .selectedImages");
    messageFromImageFiles = [e.target.files[0]];
  } else {
    selectedImages = document.querySelector(".encode-image .selectedImages");
    console.log(filesToBesteganographed);
    if (filesToBesteganographed.length === 2) {
      if (e.target.id === "enc-img-1")
        filesToBesteganographed[0] = e.target.files[0];
      else filesToBesteganographed[1] = e.target.files[0];
    } else filesToBesteganographed.push(...e.target.files);
  }
  let cursor = selectedImages.scrollLeft;
  for (let file of e.target.files)
    await delayImage(type, file, filesToBesteganographed);

  setTimeout(() => {
    selectedImages.scrollTo(0, 0);
    if (cursor) selectedImages.scrollTo(cursor, 0);
  }, 400);
};

const sendImage = (type, e, decode = 0) => {
  let loading = document.querySelector("#loading");
  loading.style.display = "flex";
  let formData = new FormData();

  if (decode === 1) {
    messageFromImageFiles.map((file) => {
      formData.append("files", file);
    });
  } else {
    filesToBesteganographed.map((file) => {
      formData.append("files", file);
    });
  }

  axios({
    method: "POST",
    url: type == "encode" ? "/steg-encode-image" : "/steg-decode-image",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then((result) => {
    let selectedImages = document.querySelectorAll(".result-image")[decode];
    console.log(selectedImages);
    while (selectedImages.lastChild)
      selectedImages.removeChild(selectedImages.lastChild);

    result.data.map((result) => {
      if (result.status == "success" || result.status == 200) {
        if (type == "encode") {
          let imgWrap = createCard("src", result.url);
          selectedImages.append(imgWrap);
        } else if (decode) {
          let imgWrap = createCard("src", result.url);
          selectedImages.append(imgWrap);
        }
      } else {
        alert(result.msg);
      }

      loading.style.display = "none";
    });
  });
};
