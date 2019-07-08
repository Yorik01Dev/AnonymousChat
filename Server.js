'use strict';

const http = require('http');
const express = require('express');
const Socket = require('socket.io');
const DbController = require('./Database/DBController.js');
const bodyParser = require('body-parser');
const crypto = require('crypto-js');
const session = require('express-session');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = Socket.listen(server);

server.listen(80);

let rooms = [];

io.sockets.on('connection', function (socket) {
   socket.on('newUser', function (username){
       console.log(username + ' has connected!');

      let waitingRooms = rooms.filter(elem => elem.waiting);
      if(waitingRooms.length > 0){
         let randRoom = waitingRooms[Math.floor(Math.random(0, waitingRooms.length))];
         randRoom.users.user2 = {
            socketID: socket.id,
            name: username
         };
         randRoom.waiting = false;

         socket.join(randRoom.name);
         io.sockets.to(randRoom.name).emit('startChat', JSON.stringify(randRoom));

         console.log('Room ' + randRoom.name + ' has been created with ' + randRoom.users.user1.name
             + ' and ' + randRoom.users.user2.name);
      }
      else{
          let roomName = crypto.lib.WordArray.random(20).toString();

          rooms.push({
             name: roomName,
             users: {
                 user1: {
                     socketID: socket.id,
                     name: username
               },
               user2: {
                   socketID: null,
                   name: null
               }
            },
             waiting: true
         });

         socket.join(roomName);
         io.sockets.to(roomName).emit('getInfoChat', JSON.stringify(rooms[rooms.length - 1]));
      }
   });

   let closeConnection = (message) => {
       for(let i in rooms){
           if(rooms[i].users.user1.socketID === socket.id || rooms[i].users.user2.socketID === socket.id){
               console.log('Room ' + rooms[i].name + ' has been closed with ' + rooms[i].users.user1.name
                   + ' and ' + rooms[i].users.user2.name);

               io.sockets.to(rooms[i].name).emit('closeChat', message);
               socket.leave(rooms[i].name);
               rooms.splice(i, 1);
               break;
           }
       }
   };

   socket.on('getMessage', (data) => {
       data = JSON.parse(data);
       io.sockets.to(data.room).emit('sendMessage', JSON.stringify(data));
   });

   socket.on('disconnect', () => closeConnection('One of the members has been disconnected :('));
   socket.on('timeEnd', () => closeConnection('Time is over :('));
   socket.on('close', () => closeConnection('One of the members has left the chat :('));
   socket.on('cancelSearch', () => closeConnection('cancel'));
});

DbController.connect()
    .then(() => console.log('The database has been established successfully!'))
    .catch(err => console.warn('Unable to connect to the database: ' + err));

app.use(session({
    secret: crypto.lib.WordArray.random(20).toString(),
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
   res.header('Access-Control-Allow-Origin', req.headers.origin);
   res.header('Access-Control-Allow-Credentials', 'true');
   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
   next();
});

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/frontend/index.html');
});

app.get('/reg', function (req, res) {
   res.sendFile(__dirname + '/frontend/reg.html');
});

app.get('/login', function (req, res) {
   res.sendFile(__dirname + '/frontend/login.html');
});

app.get('/logout', function (req, res) {
    delete req.session.userData;
    res.redirect('/login');
});

app.get('/MyAccount', function (req, res) {
    let load = (() => {
        return new Promise((resolve, reject) => {
            fs.readFile(__dirname + '/frontend/MyAccount.html', function (err, code) {
                if(err)
                    reject('Error of reading MyAccount.html: ' + err);
                else
                    if(req.session.userData)
                    resolve(code);
                    else
                        reject('No session!');
            })
        });
    })();

    load
        .then(code => {
            code = code.toString();
            let data = 'let UserData_ = ' + '`' + JSON.stringify(req.session.userData) + '`';
            let page = code.replace("let UserData_ = '';", data);

            res.send(page);
        })
        .catch(err => {console.log(err);
            res.redirect('/login');
        });
});

app.post('/checkLogin', function (req, res) {console.log(req.body);
    DbController.checkLogin(req.body.username, req.body.password)
        .then(() => {
            req.session.userData = req.body;

            res.status(200).json({success: "Yep!", status: "200"});
        })
        .catch(err => {
           res.status(err.status).json(err);
        });
});

app.post('/regUser', function (req, res) {
   DbController.regUser(req.body)
       .then(() => res.status(200).json({success: "Yep!", status: "200"}))
       .catch(err => {
           console.warn(err);
           res.send(500).end();
       });
});