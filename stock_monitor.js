const puppeteer = require('puppeteer')
var mainHandler = require('./mail')
var httpHandler = require('./http')

const scrawSezane = async function(url, size) {
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(url)

    let data = await page.evaluate(() => {
        let list = document.querySelectorAll(".c-size")
        let res = []
        for (let i = 0; i < list.length; i++) {
            res.push({
                name: list[i].className,
                size: list[i].textContent
            })
        }
        return res
    })
    for (var i = 0; i < data.length; i++) {
        if (data[i].size == size && !data[i].name.includes("is-disabled")) {
            return true;
        }
    }
    await browser.close()
    return false;
}

async function monitorStock() {
    var ret = await httpHandler.getOrderNotBuy()
    var data = ret.split("##")
    var head = "<html>\n" +
        "<head>\n" +
        "<title>官网库存监控(10分钟频率)</title>\n" +
        "</head>\n" +
        "<body>\n" +
        "<table border='1'>\n" +
        "<tr border='1'>\n" +
        "<th>顾客名字</th>\n" +
        "<th>品牌</th>\n" +
        "<th>货号</th>\n" +
        "<th>尺码</th>\n" +
        "<th>颜色</th>\n" +
        "</tr>\n";

    var tail = "</table>\n" +
        "</body>\n" +
        "</html>";
    for (var i = 0; i < data.length - 1; i++) {
        var json = JSON.parse(data[i])
        var res = await scrawSezane(json.link, json.size)
        if (res == true) {
            head = head + "<tr border='1'>\n";
            head = head + "<td>" + json.customer_name + "</td>\n";
            head = head + "<td>" + json.brand + "</td>\n";
            head = head + "<td>" + json.link + "</td>\n";
            head = head + "<td>" + json.size + "</td>\n";
            head = head + "<td>" + json.color + "</td>\n";
            head = head + "</tr>\n";
        }
    }
    var html = head + tail;
    mainHandler.sendMail(html)
    console.log(res)
    return;
}

function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms))
}

var data = monitorStock()
data.then(async function(result) {
    await sleep(1500)
    process.exit(0)
});