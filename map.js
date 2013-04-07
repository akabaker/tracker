var MapApp = {
	init: function(config) {
		this.map = L.map(config.el).setView([config.lat, config.lng], config.zoom);
		this.geo = navigator.geolocation;
		this.socket = io.connect('http://shazbot.dyndns.org:3000');
		this.markers = {};
		this.pos;
		this.options = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 0
		};

		//L.tileLayer('http://shazbot.dyndns.org:8888/v2/road-trip/{z}/{x}/{y}.png', {
		L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> '
			+ 'contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">'
			+ 'CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
			maxZoom: config.maxZoom
		}).addTo(this.map);

		this.locate();
		this.bindEvents();

		// Hacky hack to make sure that 'stationary' users, aka desktop guys show up
		// on the map
		if (this.isDesktop()) {
			var interval = setInterval(function() {
				MapApp.socket.emit('update', {position: MapApp.pos});
			},10000)
		}
	},

	bindEvents: function() {
		this.socket.on('connect', this.socketConnect);
		this.socket.on('broadcast', this.updateMarkers);
		this.socket.on('disconnect', this.socketDc);
		this.watchPosition();
	},

	socketConnect: function(message) {
		console.log(message);
	},

	socketDc: function(message) {
		var data = JSON.parse(message);
		var self = MapApp;
		self.map.removeLayer(self.markers[data.clientid]);
	},

	updateMarkers: function(message) {
		var data = JSON.parse(message);
		var self = MapApp;
		var latlng = new L.LatLng(data.position.coords.latitude, data.position.coords.longitude);

		if (self.markers[data.clientid]) {
			self.markers[data.clientid].setLatLng(latlng).update();
		} else {
			var marker = L.marker(latlng);
			marker.addTo(self.map);
			self.markers[data.clientid] = marker;
		}
	},

	locate: function() {
		this.map.locate({setView: true});
	},

	isDesktop: function() {
		if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
			return true;
		}
	},

	updateMarker: function(pos) {
		var latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
		var self = MapApp;
		if (self.isDesktop()) self.pos = pos;

		if (!self.marker) {
			self.marker = L.marker(latlng).addTo(self.map);
			self.socket.emit('update', {position: pos});
		} else {
			self.marker.setLatLng(latlng).update();
			self.socket.emit('update', {position: pos});
		}
	},

	watchPosition: function() {
		this.watch = this.geo.watchPosition(this.updateMarker, this.handleError, this.options);
	},

	handleError: function(error) {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				alert('Permission was denied');
				break;
			case error.POSITION_UNAVAILABLE:
				alert('Position is currently unavailable.');
				break;
			case error.PERMISSION_DENIED_TIMEOUT:
				alert('User took to long to grant/deny permission.');
				break;
			case error.UNKNOWN_ERROR:
				alert('An unknown error occurred.')
				break;
		}
	}
};
