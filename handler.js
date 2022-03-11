const {Wechaty} = require("wechaty");
const urllib = require("url")
var robots = new Map();
var qrcodes = new Map();

function start(request, response) {
    const bot = new Wechaty()
    bot.on('scan', onScan)
    bot.on('login', onLogin)
    bot.on('logout', onLogout)
    bot.state.on()
    robots.set(bot.id, bot)
    bot.start().then(
        () => {
            response.writeHead(200, {'Content-Type':'text/plain'});
            response.write("create Robot success: " + bot.id);
            response.end();
        }
    ).catch(
        e => {
            response.writeHead(-1, {'Content-Type':'text/plain'});
            response.write("create Robot failed:" + e);
            response.end();
        }
    )
}

function qrcode(request, response) {
    var params = urllib.parse(request.url, true)
    var robotId = params.query.robot_id
    var qrcode = qrcodes.get(robotId)
    if (qrcode == undefined) {
        response.writeHead(502, {'Content-Type':'text/plain'});
        response.write("qrcode is empty, try again!");
        response.end();
    } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write(qrcode);
        response.end();
    }
}

function robotState(request, response) {
    var params = urllib.parse(request.url, true)
    var robotId = params.query.robot_id
    var robot = robots.get(robotId)
    if (robot == undefined) {
        response.writeHead(502, {'Content-Type':'text/plain'});
        response.write("robot is not existed!");
        response.end();
        return;
    }
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("state:" + robot.state.on());
    response.end();
}

function upload(request, response) {
    console.log('do upload');
    response.writeHead(200,{'Content-Type':'text/plain'});
    response.write('upload is running');
    response.end();
}

function onScan (qrcode, status) {
    const qrcodeImageUrl = [
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcode),
    ].join('')
    console.log("scan:" + this.id)
    qrcodes.set(this.id, qrcodeImageUrl)
}

function onLogin (user) {
    console.log(`${user} login`)
}

function onLogout(user) {
    console.log(`${user} logout`)
}

// sendPayment(0.01, 1562577831000)
function sendPayment (priceAmount, timestamp) {
    console.log(priceAmount, timestamp);

    // const options = {
    //   method: 'POST',
    //   url: 'https://api.callbackurl.com/callback',
    //   headers:
    //   {
    //     'content-type': 'application/json',
    //      token: 'usertoken-callback' },
    //      body: {
    //       price_amount: priceAmount,
    //       timestamp: timestamp
    //      },
    //      json: true
    //   };

    // request(options, function (error, response, body) {
    //   if (error) throw new Error(error);
    // });
}

// 消息来自 “微信支付”，信息格式为“微信支付收款0.01元”
async function onMessage (msg) {
    if (msg.age() > 300) {
        // console.log('Message discarded because its TOO OLD(than 5 minute)')
        return
    }

    const contact = msg.from()
    const text = msg.text()
    const msgDate = msg.date()

    if (   msg.type() !== bot.Message.Type.Attachment
        && !msg.self()
    ) {
        // console.log('Message discarded because it does not match Payment Attachment')
        return
    }

    if ( contact.name() !== '微信支付'
    ) {
        // console.log('Message is not from wechat pay - from ', contact.name())
        return
    }

    const strs = text.split('元')
    if (strs.length >= 1) {
        const str= strs[0]
        const strs2 = str.split('微信支付收款')
        if (strs2.length >= 1) {
            const priceStr = strs2[1]
            sendPayment(parseFloat(priceStr), msgDate.getTime())
        }
    }
}

exports.start = start;
exports.upload = upload;
exports.qrcode = qrcode;
exports.robotState = robotState;