//路由文件
function router(handle, pathname, request, response) {
    if (typeof handle[pathname] ==='function') {   // 判断注册的路由字典对象中是否有这个函数
        return handle[pathname](request, response);
    } else{
        console.log('no request' + pathname);
        return 'NOT found';
    }
}
exports.route = router;
