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

const scrawSandro = async function(url, size) {
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(url, {timeout: 300000})
    console.log("url"+url+" size:"+size)
    let data = await page.evaluate(() => {
        let list = document.querySelectorAll(".notinstock-attr, .remove-for-popin")
        let res = []
        for (let i = 0; i < list.length; i++) {
            res.push({
                name: list[i].className,
                size: list[i].textContent.replaceAll("\n", "").substring(0, 1)
            })
        }
        return res
    })
    for (var i = 0; i < data.length; i++) {
        if (data[i].size == size && data[i].name.includes("remove-for-popin")) {
            return true;
        }
    }
    await browser.close()
    return false;
}

const scrawMaje = async function(url, size) {
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(url)

    let data = await page.evaluate(() => {
        let list = document.querySelectorAll(".swatches size > li")
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
    var mailFlag = false;
    for (var i = 0; i < data.length - 1; i++) {
        var json = JSON.parse(data[i])
        var brand = json.brand.toLowerCase();
        console.log(brand)
        var res;
        switch (brand) {
            case "sezane":
                res = await scrawSezane(json.link, json.size);
                break;
            case "sandro":
                res = await scrawSandro(json.link, json.size);
                break;
            case "maje":
                res = await scrawMaje(json.link, json.size);
                break;
            default:
                continue;
        }
        if (res == true) {
            mailFlag = true;
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
    console.log(html)
    if (mailFlag == true) {
        // mainHandler.sendMail(html)
    }
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