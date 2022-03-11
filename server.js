var http = require('http');
var url =require('url');  //url和http都是node.js模块

function start(route,handle) {  //route是路由模块，handler是注册的路由的字典
    function onRequest(request,response) {
        var pathname = url.parse(request.url).pathname;//pathname是请求的路径
        route(handle, pathname, request, response);  //将这些参数传递给route
    }
    http.createServer(onRequest).listen(8088);
    console.log('server running at 8088');
}

exports.start = start;