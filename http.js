var request = require("request");

async function getOrderNotBuy() {
    var options = { method: 'POST',
        url: 'http://122.51.6.22:8080/sina/businessService',
        headers:
            {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
        body: {
            reqString: { order_status: '1', brand: 'sezane'},
            business: 'queryOrder'
        },
        json: true
    };
    var data = await new Promise(function (resolve, reject) {
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body.respMessage)
            }

        });
    });
    return data;
}

exports.getOrderNotBuy = getOrderNotBuy;

