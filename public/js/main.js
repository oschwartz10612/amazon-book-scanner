const isbn = document.getElementById('barcode');
const box = document.getElementById('box');

const successBox = document.getElementById('success_box');
const failBox = document.getElementById('fail_box');

const socket = io();

socket.on('prompt', data => {
    var res = prompt(data);
    console.log(res);
    socket.emit('promptRes', res);
});

socket.on('fail_box_update', text => {
  failBox.innerHTML = text;
});

socket.on('success_box_update', text => {
  successBox.innerHTML = text;
});

isbn.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
      console.log(isbn.value);
      socket.emit('isbn', isbn.value);
      isbn.value = '';
    }
});

box.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
      socket.emit('set_box', box.value);
      box.value = '';
    }
});