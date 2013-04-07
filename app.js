var app = require('http').createServer(handler)
	, io = require('socket.io').listen(app)
	, fs = require('fs')

app.listen(3000);
function handler(req, res) {
	fs.readFile(__dirname + '/index.html',
	function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}
/*
var files = ['/index.html', '/map.js'];
function handler(req, res) {
	var url = req.url || '/index.html'
	fs.readFile(__dirname + url,
	function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}
*/

var markers = {};

io.sockets.on('connection', function(socket) {
	io.sockets.emit('connect', {message: 'user connected', clientid: socket.id});

	socket.on('update', function(data) {
		socket.broadcast.emit('broadcast', JSON.stringify({clientid: socket.id, position: data.position}));
		markers[socket.id] = data.position;
	});

	socket.on('disconnect', function() {
		socket.broadcast.emit('disconnect', JSON.stringify({clientid: socket.id}));
		delete markers[socket.id];
	});
});
