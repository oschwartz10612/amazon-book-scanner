const isbn = document.getElementById('barcode');
const box = document.getElementById('box');

isbn.addEventListener('keyup', event => {
    if (event.keyCode === 13) {
        fetch("/profit_check", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isbn: isbn.value
            }),
          })
            .then(function (response) {
              console.log("done");
              isbn.value = '';
              return response;
            })
            .catch(function (err) {
              console.log(err);
            });
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