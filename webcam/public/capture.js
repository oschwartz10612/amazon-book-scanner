// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

var width = 1920; // We will scale the photo width to this
var height = 0; // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

var streaming = false;

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");

navigator.mediaDevices
  .getUserMedia({
    //video: { facingMode: { exact: "environment" } },
    video: true,
    audio: false
  })
  .then(function (stream) {
    video.srcObject = stream;
    video.play();
  })
  .catch(function (err) {
    console.log("An error occurred: " + err);
  });

video.addEventListener(
  "canplay",
  function (ev) {
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth / width);

      // Firefox currently has a bug where the height can't be read from
      // the video, so we will make assumptions if this happens.

      if (isNaN(height)) {
        height = width / (4 / 3);
      }

      video.setAttribute("width", width);
      video.setAttribute("height", height);
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);
      streaming = true;
    }
  },
  false
);

startButton.addEventListener(
  "click",
  function (ev) {
    takePicture();
    ev.preventDefault();
  },
  false
);

clearPhoto();

// Fill the photo with an indication that none has been
// captured.

function clearPhoto() {
  var context = canvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);


}

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

async function takePicture() {
  var context = canvas.getContext("2d");
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

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
  } else {
    clearPhoto();
  }
}