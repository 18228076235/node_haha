var express = require('express');
var router = express.Router();
var conn = require('../db/conn');
var async = require('async');
var fs = require('fs');
var multiparty = require('multiparty')



/* GET home page. */
//首页
router.get('/', function(req, res, next) {
    var username = req.session.username;
    res.render('index', { title: 'index', username: username });
});


//登录
router.get('/login', function(req, res) {
    var username = req.session.username;
    res.render('login', { title: 'login', username: username })
})


//注册
router.get('/register', function(req, res) {
    var username = req.session.username;
    res.render('register', { title: 'register', username: username })
})

//退出登录
router.get('/out', function(req, res) {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/')
    })
})


//主要内容按热度排序
router.get('/main', function(req, res) {
    var username = req.session.username;
    var every = 5;
    var page = 0;
    var cont = 0;
    var pageNo = req.query.pageNo;
    pageNo = pageNo ? parseInt(pageNo) : 1;
    conn.getDb((err, db) => {
        if (err) throw err;
        var haha = db.collection('list');
        async.waterfall([function(callback) {
                haha.find({}, { _id: 0, text: 1, hate: 1, love: 1, name: 1, proflie: 1, id: 1, profile_image: 1 }).toArray((err, resout) => {
                    if (err) throw err;
                    if (resout.length > 0) {
                        cont = resout.length;
                        page = Math.ceil(cont / every)
                        callback(null, true)

                    } else {
                        console.log('数据没有')
                        callback(null, false)
                    }
                })

            },
            function(msg, callback) {
                if (msg) {
                    haha.find().sort({ love: -1, hate: 1 }).skip((pageNo - 1) * every).limit(every).toArray((err, resout) => {
                        if (err) throw err;

                        callback(null, resout)
                    })

                } else {
                    callback(null, false)
                }
            }
        ], function(err, resout) {
            if (err) throw err;
            if (resout.length >= 1) {
                res.render('main', { title: 'main', username: username, resout: resout, every: every, page: page, pageNo: pageNo })
            } else {
                console.log("没有数据")
            }
        })

    })
})

router.get('/comment', (req, res) => {
    res.render('comment', { title: 'index', username: 'text' });
})



//上传图片
router.post("/uploadImg", (req, res) => {
    console.log("上传图片");
    // multiparty

    var form = new multiparty.Form(); // 实例化
    // 设置编码
    form.encoding = "UTF-8";
    // 设置文件的临时存储路径 
    form.uploadDir = "./uploadtemp";
    // 设置上传图片的大小限制
    form.maxFilesSize = 2 * 1024 * 1024; // 2M

    form.parse(req, (err, fields, files) => {
        if (err) throw err;
        // fields 文件域
        // files  对应的文件
        console.log(fields);
        console.log(files);
        var uploadUrl = "/images/upload/"; // 文件上传的真实路径
        file = files["filedata"]; // 富文本编辑框  filedata
        originalFilename = file[0].originalFilename; //文件名称 
        tempath = file[0].path; //  文件的临时路径   进行读  readStream

        var timestamp = new Date().getTime(); // 获取时间戳  4444
        uploadUrl += timestamp + originalFilename; // /images/upload/44442.jpg
        newPath = "./public" + uploadUrl; // 文件的写入路径 

        // 通过文件读写流进行操作  
        var fileReadStream = fs.createReadStream(tempath); // 读取文件流
        var fileWriteStream = fs.createWriteStream(newPath); //写入文件流

        fileReadStream.pipe(fileWriteStream);


        // 监听文件上传关闭
        fileWriteStream.on("close", () => {
            // 同步删除  临时文件夹的文件
            fs.unlinkSync(tempath);
            res.send('{"err":"","msg":"' + uploadUrl + '"}');
        })
    })
})



//提交评论
router.post('/submit', function(req, res) {
    var username = req.session.username

    var title = req.body.title;
    var cotent = req.body.cotent;
    if (username) {
        conn.getDb((err, db) => {
            async.waterfall([function(callback) {
                var cid = db.collection('cid');
                cid.findAndModify({ name: "comment" }, [
                    ["_id", "desc"]
                ], { $inc: { id: 1 } }, function(err, resout) {
                    if (err) throw err;
                    callback(null, resout.value.id)
                })
            }, function(sql, callback) {
                var data = new Date();
                var m = data.getFullYear + '-' + data.getMonth + '-' + data.getDate + '  ' + data.getHours + ":" + data.getMinutes + ":" + data.getSeconds
                var comment = db.collection('comment');
                comment.insert({ name: username, text: cotent, ct: data, id: sql, title: title, love: 0, hate: 0 }, (err, resout) => {
                        if (err) throw err;
                        callback(null, resout)
                    })
                    //把数据存入center
                var center = db.collection('center');
                center.insert({ name: username, text: cotent, ct: data, id: sql, title: title, love: 0, hate: 0 }, (err, resout) => {
                    if (err) throw err;
                })

            }], function(err, resout) {
                if (err) throw err;
                res.send('1')
            })
        })
    } else {
        res.send('0')
    }
})




//最新按时间排序
router.get('/new', (req, res) => {
    var username = req.session.username;
    var every = 5;
    var page = 0;
    var cont = 0;
    var pageNo = 1;
    pageNo = pageNo ? parseInt(pageNo) : 1;
    conn.getDb((err, db) => {
        if (err) throw err;
        var comment = db.collection('comment');
        async.waterfall([function(callback) {
                comment.find({}, { _id: 0, text: 1, name: 1, id: 1, ct: 1, title: 1 }).toArray((err, resout) => {
                    if (err) throw err;
                    if (resout.length > 0) {
                        cont = resout.length;
                        page = Math.ceil(cont / every)
                        callback(null, true)

                    } else {
                        console.log('数据没有')
                        callback(null, false)
                    }
                })

            },
            function(msg, callback) {
                if (msg) {
                    comment.find().sort({ _id: -1 }).skip((pageNo - 1) * every).limit(every).toArray((err, resout) => {
                        if (err) throw err;
                        callback(null, resout)
                    })

                } else {
                    callback(null, false)
                }
            }
        ], function(err, resout) {
            if (err) throw err;
            if (resout.length >= 1) {
                res.render('new', { title: 'new', username: username, resout: resout, every: every, page: page, pageNo: pageNo })
            } else {
                console.log("没有数据")
            }
        })

    })
})



//个人中心
router.get('/center', (req, res) => {
    var username = req.session.username;
    if (username) {
        //通过用户名查找用户信息


        async.parallel({
            oneClass: function(callback) {
                conn.getDb((err, db) => {
                    if (err) throw err;
                    var center = db.collection('center');
                    center.find({ name: username }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;
                        callback(null, resout)

                    })
                })
            },
            towClass: function(callback) {
                conn.getDb((err, db) => {
                    if (err) throw err;
                    var love = db.collection('love');
                    love.find({ username: username }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;
                        callback(null, resout)
                    })
                })

            },
            treenClass: function(callback) {
                conn.getDb((err, db) => {
                    if (err) throw err;
                    var hate = db.collection('hate');
                    hate.find({ username: username }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;
                        callback(null, resout)
                    })
                })


            }
        }, function(err, resout) {
            if (err) throw err;
            console.log(resout.oneClass)
            console.log('---------------------------------')
            console.log(resout.towClass)
            console.log('-----------------------------')
            console.log(resout.treenClass)
            res.render('center', { title: "个人中心", username: username, resoutOne: resout.oneClass, resoutTow: resout.towClass, resoutTree: resout.treenClass })
        })





    } else {
        res.redirect('/login')
    }

})

//com-list
router.post('/com-list', (req, res) => {
    var id = req.body.id;
    var text = req.body.text;
    var username = req.session.username;
    if (username) {
        conn.getDb((err, db) => {
            if (err) throw err;
            var com_list = db.collection('com_list');
            var data = new Date();
            com_list.insert({ id: id, text: text, name: username, ct: data }, (err, resout) => {
                if (err) throw err;
            })
            com_list.find({ id: id }, { _id: 0 }).toArray((err, resout) => {
                if (err) throw err;
                res.send(resout)
            })
        })

    } else {
        res.send('1')
    }
})



module.exports = router;