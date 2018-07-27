'use strict';

var express      = require('express');
var cookieParser = require('cookie-parser');

var app = express();


app.use('/example', express.static(__dirname + "/example"));
app.use('/track/track.gif', express.static(__dirname));

app.use(express.static(__dirname));

// app.all('*', function(req, res, next) {  
//     res.header("Access-Control-Allow-Origin", '*'); 
//     res.header("Access-Control-Allow-Headers", "Origin, X-requested-With, Content-Type, Accept");  
//     res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
//     // res.header("X-Powered-By",' 3.2.1')  
//     // res.header("Content-Type", "application/json;charset=utf-8");  
//     next();  
// });

app.get('/', function(req, res) {
    res.redirect(301, '/example/');
});


app.get('/track', function(req, res) {
    //console.log('track: ' +JSON.stringify(req.query));
    console.log('track: data' +new Buffer(JSON.stringify(req.query.data), 'base64').toString());
    console.log('==================================================================================');
    res.send(new Buffer(JSON.stringify(req.query.data), 'base64').toString());
});



var http = require('http');
var querystring = require('querystring');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


var server = app.listen(3300, function () {
  console.log('11 test app listening on port %s', server.address().port);
});
