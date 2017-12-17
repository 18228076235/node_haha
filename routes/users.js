var express = require('express');
var router = express.Router();
var conn = require('../db/conn');
var async = require('async')

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});


//注册
router.all('/findname', function(req, res) {

    var username = req.query.name
    conn.getDb((err, db) => {
        if (err) throw err;
        var user = db.collection('user');
        user.find({ name: username }).toArray((err, resout) => {
            if (err) throw err;
            if (resout.length < 1) {
                res.send('1')
            } else {
                res.send('2')
            }
        })
    })
})


//注测插入数据库

//注册
router.all('/register', function(req, res) {
    var password = req.query.password;
    var username = req.query.name;

    console.log('-----------------------------------------')
    conn.getDb((err, db) => {
        if (err) throw err;
        var user = db.collection('user');
        async.waterfall([function(callback) {
                user.find({ name: username }).toArray((err, resout) => {
                    if (err) throw err;
                    if (resout.length < 1) {
                        callback(null, true)
                    } else {
                        callback(null, false)
                    }
                })
            }, function(sql, callback) {
                if (sql) {
                    user.insert({ name: username, pass: password }, (err, resout) => {
                        if (err) throw err;
                        callback(null, "0")
                    })
                } else {
                    callback(null, "1")
                }
            }],
            function(err, resout) {
                if (err) throw err;
                if (resout == 0) {
                    res.send('1')
                } else {
                    res.send('0')
                }
            })
    })
})

//登录验证
router.post('/login', function(req, res) {
    var username = req.body.username;

    conn.getDb((err, db) => {
        if (err) throw err;
        var user = db.collection('user');
        user.findOne({ name: username }, (err, resout) => {
            if (err) throw err;
            if (resout) {
                req.session.username = username;
                res.send(resout.pass);
            } else {
                res.send('1')
            }
        })
    })

})



//点击喜欢按热度排序的喜欢    改变list 里面的love值,存一个用户自己的  评论， 喜欢，不喜欢，文章id，以及自己所提交的评论并实现删除修改；

//最新页喜欢
router.get('/like', (req, res) => {
        //findAndModif
        var username = req.session.username;
        if (username) {
            var id = (req.query.id) * 1;
            var cont = req.query.cont;

            conn.getDb((err, db) => {
                if (err) throw err;
                var comment = db.collection('comment');
                var center = db.collection('center');

                //更新center
                if (cont == 1) {
                    comment.update({ id: id }, { $inc: { love: 1 } }, (err, resout) => {
                        if (err) throw err;
                        res.send('1')
                    })


                    //更新center   先把内容存进center然后再love自增
                    async.waterfall([function(callback) {
                        comment.find({ id: id }, { _id: 0 }).toArray((err, resout) => {
                            if (err) throw err;
                            if (resout.length > 0) {
                                callback(null, resout)
                            } else {
                                callback(null, false)
                            }

                        })
                    }, function(msg, callback) {
                        if (msg) {
                            var love = db.collection('love')
                            love.insert({ id: msg[0].id, text: msg[0].text, profile_image: msg[0].profile_image, name: msg[0].name, username: username }, (err, resout) => {
                                if (err) throw err;

                                callback(null, resout)
                            })
                        } else {
                            callback(null, false)
                        }

                    }], function(err, resout) {
                        if (err) throw err;
                        console.log('---------------------------------------------')
                        if (resout) {
                            console.log('插入成功')
                        }
                    })


                }
                if (cont == -1) {
                    comment.update({ id: id }, { $inc: { love: -1 } }, (err, resout) => {
                            if (err) throw err;
                            res.send('-1')
                        })
                        //删除点赞的内容
                    var love = db.collection('love')
                    love.remove({ id: id }, (err, resout) => {
                        if (err) throw err;
                        console.log('删除成功')
                    })
                }
            })


        } else {
            res.redirect('/login')
        }
    })
    //最新页不喜欢
router.get('/hate', (req, res) => {
    //findAndModif
    var username = req.session.username;
    if (username) {
        var id = (req.query.id) * 1;
        var cont = req.query.cont;
        conn.getDb((err, db) => {
            if (err) throw err;
            var comment = db.collection('comment');
            var center = db.collection('center');

            //更新center
            if (cont == 1) {
                comment.update({ id: id }, { $inc: { hate: 1 } }, (err, resout) => {
                    if (err) throw err;
                    res.send('1')
                })


                //更新center   先把内容存进center然后再love自增
                async.waterfall([function(callback) {
                    comment.find({ id: id }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;

                        if (resout.length > 0) {
                            callback(null, resout)
                        } else {
                            callback(null, false)
                        }

                    })
                }, function(msg, callback) {
                    if (msg) {
                        var love = db.collection('hate')
                        love.insert({ id: msg[0].id, text: msg[0].text, profile_image: msg[0].profile_image, name: msg[0].name, username: username }, (err, resout) => {
                            if (err) throw err;

                            callback(null, resout)
                        })
                    } else {
                        callback(null, false)
                    }

                }], function(err, resout) {
                    if (err) throw err;
                    console.log('---------------------------------------------')
                    if (resout) {
                        console.log('插入成功')
                    }
                })


            }
            if (cont == -1) {
                comment.update({ id: id }, { $inc: { hate: -1 } }, (err, resout) => {
                    if (err) throw err;
                    res.send('-1')
                        //删除点赞的内容
                    var hate = db.collection('hate')
                    hate.remove({ id: id }, (err, resout) => {
                        if (err) throw err;
                        console.log('删除成功')
                    })
                })
            }
        })
    } else {
        res.redirect('/login')
    }

})


//主页喜欢
router.get('/ilike', (req, res) => {
    //findAndModif
    var username = req.session.username;
    if (username) {
        var id = req.query.id;
        var cont = req.query.cont;
        conn.getDb((err, db) => {
            if (err) throw err;
            var list = db.collection('list');
            var center = db.collection('center');

            //更新center
            if (cont == 1) {
                list.update({ id: id }, { $inc: { love: 1 } }, (err, resout) => {
                    if (err) throw err;
                    res.send('1')
                })


                //更新center   先把内容存进center然后再love自增
                async.waterfall([function(callback) {
                    list.find({ id: id }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;

                        if (resout.length > 0) {
                            callback(null, resout)
                        } else {
                            callback(null, false)
                        }

                    })
                }, function(msg, callback) {
                    if (msg) {
                        var love = db.collection('love')
                        love.insert({ id: msg[0].id, text: msg[0].text, profile_image: msg[0].profile_image, name: msg[0].name, username: username }, (err, resout) => {
                            if (err) throw err;

                            callback(null, resout)
                        })
                    } else {
                        callback(null, false)
                    }

                }], function(err, resout) {
                    if (err) throw err;
                    console.log('---------------------------------------------')
                    if (resout) {
                        console.log('插入成功')
                    }
                })


            }
            if (cont == -1) {
                list.update({ id: id }, { $inc: { love: -1 } }, (err, resout) => {
                        if (err) throw err;
                        res.send('-1')
                    })
                    //删除点赞的内容
                var love = db.collection('love')
                love.remove({ id: id }, (err, resout) => {
                    if (err) throw err;
                    console.log('删除成功')
                })
            }
        })
    } else {
        res.redirect('/login')
    }

})

//主页不喜欢
router.get('/ihate', (req, res) => {
    //findAndModif
    var username = req.session.username;
    if (username) {

        var id = req.query.id;
        var cont = req.query.cont;
        conn.getDb((err, db) => {
            if (err) throw err;
            var list = db.collection('list');
            var center = db.collection('center');

            //更新center
            if (cont == 1) {
                list.update({ id: id }, { $inc: { hate: 1 } }, (err, resout) => {
                    if (err) throw err;
                    res.send('1')
                })


                //更新center   先把内容存进center然后再love自增
                async.waterfall([function(callback) {
                    list.find({ id: id }, { _id: 0 }).toArray((err, resout) => {
                        if (err) throw err;

                        if (resout.length > 0) {
                            callback(null, resout)
                        } else {
                            callback(null, false)
                        }

                    })
                }, function(msg, callback) {
                    if (msg) {
                        var love = db.collection('hate')
                        love.insert({ id: msg[0].id, text: msg[0].text, profile_image: msg[0].profile_image, name: msg[0].name, username: username }, (err, resout) => {
                            if (err) throw err;
                            callback(null, resout)
                        })
                    } else {
                        callback(null, false)
                    }

                }], function(err, resout) {
                    if (err) throw err;
                    console.log('---------------------------------------------')
                    if (resout) {
                        console.log('插入成功')
                    }
                })
            }
            if (cont == -1) {
                list.update({ id: id }, { $inc: { hate: -1 } }, (err, resout) => {
                    if (err) throw err;
                    res.send('-1')
                        //删除点赞的内容
                    var hate = db.collection('hate')
                    hate.remove({ id: id }, (err, resout) => {
                        if (err) throw err;
                        console.log('删除成功')
                    })
                })
            }
        })

    } else {
        res.redirect('/login')
    }

})



//删除自己的评论

router.get('/delet', (req, res) => {
    var id = (req.query.id) * 1;
    console.log(id)
    conn.getDb((err, db) => {
        if (err) throw err;
        var center = db.collection('center');
        center.remove({ id: id }, (err, resout) => {
            if (err) throw err;
            res.send('1')
        })
    })

    conn.getDb((err, db) => {
        if (err) throw err;
        var comment = db.collection('comment');
        comment.remove({ id: id }, (err, resout) => {
            if (err) throw err;

        })
    })
})

//修改自己的评论
router.post('/update', (req, res) => {
    var id = (req.body.id) * 1;
    var text = req.body.cont
    console.log(id);
    conn.getDb((err, db) => {
        if (err) throw err;
        var center = db.collection('center');
        center.update({ id: id }, { $set: { text: text } }, (err, resout) => {
            if (err) throw err;

            res.send('1')
        })

    })
})



module.exports = router;