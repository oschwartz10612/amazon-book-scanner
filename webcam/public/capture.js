const video = document.getElementById("video");
const canvas = document.createElement("canvas");

video.addEventListener('click', takePicture);

var canVibrate = "vibrate" in navigator || "mozVibrate" in navigator;


navigator.mediaDevices
  .getUserMedia({
    video: {
      width: { ideal: 2048 },
      height: { ideal: 1080 },
      facingMode: "environment" 
  },
    //video: true,
    audio: false,
  })
  .then(function (stream) {
    video.srcObject = stream;
    video.play();
  })
  .catch(function (err) {
    console.log("An error occurred: " + err);
  });

clearPhoto();

function clearPhoto() {
  var context = canvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, video.videoWidth, video.videoHeight);
}

function takePicture() {
  navigator.vibrate(100);


  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas
    .getContext("2d")
    .drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  canvas.toBlob((blob) => {
    let fd = new FormData();
    fd.append("image", blob, "image.png");

    fetch("/image", {
      method: "POST",
      body: fd,
    })
      .then(function (response) {
        console.log("done");
        return response;
      })
      .catch(function (err) {
        console.log(err);
      });
  }, "image/png");
}
