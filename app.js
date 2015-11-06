/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  user = require('./routes/user'),
  http = require('http'),
  path = require('path'),
  user_model = require('./models/users');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var users = rooms = {}; //存储在线用户列表的对象
var currentRoom;
app.get('/test',function(req,res){
  user_model.getAll({room: 1}, function(docs) {
      console.log(docs);
      res.send(docs);
    });

});
app.get('/', function(req, res) {
  if (req.cookies.user == null) {
    res.redirect('/signin');
  } else {
    res.sendfile('views/index.html');
  }
});
app.get('/signin', function(req, res) {
  res.sendfile('views/signin.html');
});
app.post('/signin', function(req, res) {
  if (users[req.body.name]) {
    //存在，则不允许登陆
    res.redirect('/signin');
  } else {
    //不存在，把用户名存入 cookie 并跳转到主页

    user_model.getOne({
      nickname: req.body.name,
      room: req.body.room
    }, function(docs) {
      if (!docs) {
        user_model.add({
          nickname: req.body.name,
          room: parseInt(req.body.room)
        });
      }
    });
    res.redirect('/?room=' + req.body.room + '&nickname=' + req.body.name);
  }
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket) {

  //有人上线
  socket.on('online', function(data) {
    //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
    console.log('online'+data);
    socket.name = data.user;
    socket.room = data.room;
    user_model.getAll({
      room: data.room
    }, function(docs) {
      if (docs) {
        //向所有用户广播该用户上线信息
        io.sockets.emit('online', {
          users: docs,
          user: data.user,
          room: data.room
        });
      }
    });

  });

  //有人发话
  socket.on('say', function(data) {
    if (data.to == 'all') {
      //向其他所有用户广播该用户发话信息
      var clients = io.sockets.clients();
      
      user_model.getAll({room: 1}, function(docs) {
        //遍历当前room的用户
        for (var i = 0; i < docs.length; i++) {
          //发给room 里的所有人
          clients.forEach(function(client) {
            if (docs[i].nickname == client.name) {
              //触发该用户客户端的 say 事件
              client.emit('say', data);
            }

          });
        }
      });
      // socket.broadcast.emit('say', data);
    } else {
      //向特定用户发送该用户发话信息
      //clients 为存储所有连接对象的数组
      var clients = io.sockets.clients();
      //遍历找到该用户
      clients.forEach(function(client) {
        if (client.name == data.to) {
          //触发该用户客户端的 say 事件

          client.emit('say', data);
        }
      });
    }
  });

  //有人下线
  socket.on('disconnect', function() {
    //若 users 对象中保存了该用户名
    if (users[socket.name]) {
      //从 users 对象中删除该用户名
      delete users[socket.name];
      //向其他所有用户广播该用户下线信息
      socket.broadcast.emit('offline', {
        users: users,
        user: socket.name
      });
    }
  });
});

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});