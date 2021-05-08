const isbn = document.getElementById("barcode");
const box = document.getElementById("box");

const successBox = document.getElementById("success_box");
const failBox = document.getElementById("fail_box");
const prompts = document.getElementById("prompts");

const socket = io();

const failSound = new Audio("audio/fail.mp3");
const successSound = new Audio("audio/success.mp3");
const attentionSound = new Audio("audio/attn.mp3");

socket.on("prompt", (data) => {
  // var res = prompt(data);
  // console.log(res);
  // socket.emit('promptRes', res);

  const question = data.shift();
  console.log(question);

  var template = Handlebars.compile(`

      <h3>{{question}}</h3>

      <div class="row row-cols-1 row-cols-md-2 g-4">
        {{#each options}}

        <div class="col">
          <div class="card" style="width: 18rem">
            <div class="card-body">
              <h5 class="card-title">{{this}}</h5>
              <button class="btn btn-primary" onclick="promptRes({{@index}});">Select</button>
            </div>
          </div>
        </div>

        {{/each}}
      </div>

    `);

  prompts.innerHTML = template({ options: data, question: question });
});

function promptRes(index) {
  socket.emit('promptRes', index);
  prompts.innerHTML = '';
}

socket.on("fail_box_update", (text) => {
  failBox.innerHTML = text;
});

socket.on("success_box_update", (text) => {
  successBox.innerHTML = text;
});

socket.on("fail_sound", () => {
  failSound.play();
});
socket.on("success_sound", () => {
  successSound.play();
});
socket.on("attn_sound", () => {
  attentionSound.play();
});

isbn.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    console.log(isbn.value);
    socket.emit("isbn", isbn.value);
    isbn.value = "";
  }
});

box.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    socket.emit("set_box", box.value);
    box.value = "";
  }
});
