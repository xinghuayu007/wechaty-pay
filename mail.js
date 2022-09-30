const nodemailer = require('nodemailer')
let transporter = nodemailer.createTransport({
    service: 'qq',
    port: 465, // SMTP 端口
    secureConnection: true, // 使用了 SSL
    auth: {
        user: '1450306854@qq.com',
        pass: 'zaxawosrbkudffeg',
    }
});



function sendMail(content) {
    console.log(content)
    var mailOpt= {
        from: '1450306854@qq.com',
        to: '1450306854@qq.com;314056091@qq.com;358246832@qq.com;laurayang912912@sina.com;',
        subject: '官网补货通知',
        html: content
    };
    transporter.sendMail(mailOpt, (error, info) => {
        if (error) {
            console.log(error);
	        return error;
        }
        console.log('邮件已发送成功,邮件id: %s', info.messageId);
        return true;
    });
}

exports.sendMail=sendMail;
