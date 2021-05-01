const isbn = document.getElementById('barcode');
const box = document.getElementById('box');

const socket = io();

socket.on('prompt', data => {
    var res = prompt(data);
    console.log(res);
    socket.emit('promptRes', res);
});

isbn.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
      console.log(isbn.value);
      socket.emit('isbn', isbn.value);
    }
});

box.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
      socket.emit('set_box', box.value);
    }
});