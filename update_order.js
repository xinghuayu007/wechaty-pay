var httpHandler = require('./http')
var login = async function() {
    let request = require("request")
    let urlencode = require("urlencode")
    let url = "http://fatao.majexpress.com/api/op_user.aspx?op=login&name=molinaris.lorrine7%2540gmail.com&pwd=HYp-aY6-rFa-agp&code=&r=0.3366558316114727"
    let headers = {
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
    };
    let opts = {
      url: url,
      method: 'GET',
      headers: headers,
    };

    //模拟登陆
    let data = await new Promise(function (resolve, reject) {
        request(opts, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                cookie = response.headers['set-cookie']; //这里是登陆后得到的cookie,(重点)
                resolve(cookie)
            }

        });
    });
    return data;
}

var http_get = async function (cookie, url) {
    let request = require('request');
    let opts = {
        url: url, 
        headers: {
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`,
            Cookie: cookie[2],
       }
    };
    let data = await new Promise(function (resolve, reject) {
        request(opts, function (error, response, body) {
            if (error) {
               reject(error);
            } else {
               resolve(body) 
            }

        });
    });
    return data;
}

var main = async function () {
    // 获取cookie
    let cookie = await login()
    // 获取入库订单信息
    let url = "http://fatao.majexpress.com/usercenter/forecast_list.aspx?status=2"
    let data = await http_get(cookie, url) 
    let start_index = data.indexOf("<table")
    let end_index = data.indexOf("</table>")
    let order_table = data.substring(start_index, end_index)
    let start = 0
    let end = 0
    let urls = new Set()
    while(start >= 0) {
	start = order_table.indexOf("<a href=")
        if (start < 0 ) break
        end = order_table.indexOf("</a>")
        href = order_table.substring(start, end)
        s = href.indexOf("=\"") + 2
        e = href.indexOf("\">")
        urls.add(href.substring(s, e))
        order_table = order_table.substring(end+4)
    } 
    console.log(urls) 
    let order_map = new Map()
    for (var one of urls) {
        let detail_url = "http://fatao.majexpress.com/usercenter/" + one
        let detail_data = await http_get(cookie, detail_url)
        start = detail_data.indexOf("flight-card-title")
        detail_data = detail_data.substring(start)
        end = detail_data.indexOf("</h4>")
        post_detail = detail_data.substring(0, end)
        pos = post_detail.indexOf(">")
        // 快递信息
        post_info = post_detail.substring(pos + 1)
        start = detail_data.indexOf("collections-title")
        detail_data = detail_data.substring(start)
        end = detail_data.indexOf("</p>")
        order_detail = detail_data.substring(0, end)
        start = order_detail.indexOf("strong>")
        end = order_detail.indexOf("</strong>")
        order_detail = order_detail.substring(start + 7, end)
        let order_info = order_detail.split(" ")
        for (var i = 1; i < order_info.length; i++) {
            order_map[order_info[i]] = post_info
        }
    }
    // 获取发货信息
    let express_url = "http://fatao.majexpress.com/usercenter/myOrder.aspx?status=5"
    let express_data = await http_get(cookie, express_url)
    start = express_data.indexOf("<table")
    end = express_data.indexOf("</table>")
    express_table = express_data.substring(start, end)
    start = 0
    end = 0
    let express_urls = new Set()
    while(start >= 0) {
	start = express_table.indexOf("<a href=")
        if (start < 0 ) break
        end = express_table.indexOf("</a>")
        href = express_table.substring(start, end)
        s = href.indexOf("'order_detail") + 1
        e = href.indexOf("' title=")
        if (s < e) express_urls.add(href.substring(s, e))
        express_table = express_table.substring(end+4)
    } 
    var express_map = new Map()
    for (one of express_urls) {
        express_detail_url = "http://fatao.majexpress.com/usercenter/" + one
        express_detail = await http_get(cookie, express_detail_url)
        // 提取快递单号
        start = express_detail.indexOf("<table")
        end = express_detail.indexOf("</table>")
        express_info = express_detail.substring(start, end)
        s = express_info.indexOf("<a href=")
        e = express_info.indexOf("</a>")
        express_id = express_info.substring(s, e)
        pos = express_id.indexOf(">")
        express_id = express_id.substring(pos + 1)
        // 提取订单单号
        express_detail = express_detail.substring(end + 8)
        start = express_detail.indexOf("<table")
        end = express_detail.indexOf("</table>")
        order_detail = express_detail.substring(start, end) 
        start = 0
        end = 0
        while (start >= 0) {
	    start = order_detail.indexOf("<tr")
            end = order_detail.indexOf("</tr>")
            order = order_detail.substring(start, end)
            s = order.indexOf("<td")
            e = order.indexOf("</td>")
            if (s < e) {
                order_info = order.substring(s, e)
                pos = order_info.indexOf(">") + 1
                order_info = order_info.substring(pos).trim()
                order_list = order_info.split(" ")
                for (var i = 1; i < order_list.length; i++) {
		    express_map[order_list[i]] = express_id 
                }
            }
            order_detail = order_detail.substring(end + 5)
        }
    }
    // 更新入库订单信息
    console.log(order_map)
    for (var key in order_map) {
        var dataObj = {}
        dataObj['express_id'] = key
        dataObj['post_id'] = "已入库"
        dataObj['op_id'] = '1'
        reqString = JSON.stringify(dataObj)
        let res = await httpHandler.updateOrder(reqString)
        console.log(res)
    }
    // 更新发货信息
    for (var key in express_map) {
        var dataObj = {}
        if (key.length <= 1) continue
        dataObj['express_id'] = key
        dataObj['post_id'] = express_map[key]
        dataObj['op_id'] = '2'
        reqString = JSON.stringify(dataObj)
        let res = await httpHandler.updateOrder(reqString)
        console.log(res)
    }
}

let app = main()
