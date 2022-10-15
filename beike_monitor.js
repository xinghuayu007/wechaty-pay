const puppeteer = require('puppeteer')
var mainHandler = require('./mail')
var httpHandler = require('./http')
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host: '139.155.44.32',
  port: '3306',
  user: 'root',
  password: 'Xinghuayu_007',
  database: 'beike'
});
var date = require("silly-datetime");

const storeSaleData = async function(sale_data) {
   connection.connect();
   var sql = "insert into sale_data (data_date, district, avg_price, on_sale_num, saled_num, watch_times) values(?,?,?,?,?,?)";
   var today = date.format(new Date(),'YYYY-MM-DD');
   var params = [today, "森林小镇", sale_data['avg_price'], sale_data['on_sale_num'], sale_data['saled_num'], sale_data['watch_times']]
   connection.query(sql, params, function (err, result) {
        if(err){
         console.log('[INSERT ERROR] - ',err.message);
         return;
        }  
   });
   connection.end();
   return true;
}

const scrawSaleData = async function(url) {
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.goto(url, {timeout: 300000})
    let data = await page.evaluate(() => {
        let list = document.querySelectorAll(".agentCardDetailInfo")
        let res = []
        for (let i = 0; i < list.length; i++) {
            res.push({
                data: list[i].textContent.replaceAll("\n", "").replace(/\s*/g,"")
            })
        }
        return res
    })
    await browser.close()
    var avg_price = data[0]['data'].replace("元/平米", "")
    var on_sale_num = data[1]['data'].replace("套", "")
    var saled_num = data[2]['data'].replace("套", "")
    var watch_times = data[3]['data'].replace("次", "")
    let sale_data = {
	"avg_price": avg_price,
        "on_sale_num": on_sale_num,
        "saled_num": saled_num,
        "watch_times": watch_times,
    };
    return sale_data;
}

async function monitorBeike() {
    let url = "https://wh.ke.com/ershoufang/rs%E6%A3%AE%E6%9E%97%E5%B0%8F%E9%95%87/";
    sale_data = await scrawSaleData(url); 
    res = await storeSaleData(sale_data)
    console.log(true)
    return;
}

function sleep(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms))
}

var data = monitorBeike()
data.then(async function(result) {
    await sleep(1500)
    process.exit(0)
});
