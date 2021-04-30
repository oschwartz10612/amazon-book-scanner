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
        fetch("/set_box", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                box: box.value
            }),
          })
            .then(function (response) {
              console.log("done");
              box.value = '';
              return response;
            })
            .catch(function (err) {
              console.log(err);
            });
    }
});