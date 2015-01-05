var express = require('express');
var sys = require('sys');
var router = express.Router();

/* Router */
router.get('/', function(req, res) {
	res.send("ok");
});

var event = {
	cmd: null,
	args: null,
};

router.post('/api/script/open', function(req, res) {
	var socket = req.app.get('socket');
	
	event.cmd = 'ui/load';
	event.args = { scriptPath : req.body.scriptPath }
	socket.emit('event', event);
	res.json({ result: 'ok' });
});

router.post('/api/script/waitend', function(req, res) {	
	var script_timeout = req.body.script_timeout;
	var error = [];	
	var socket = req.app.get('socket');
	var script_end_listener = {
		cmd: 'script/replay/end',
		once: true,
		timeout: script_timeout,
	};	
	socket.emit('listen', script_end_listener);
	var step_end_listener = {
		cmd: 'step/end',
		once: false,
	};
	socket.emit('listen', step_end_listener);
	
	socket.on ('answer', function (data) {
		if (data.cmd == 'script/replay/end')
		{
			socket.emit('remove_listener', step_end_listener);
			res.json({ retCode: data.retCode, error: error.length > 0 ? JSON.stringify(error) : "" });
		}
		else if (data.cmd == 'step/end')
		{
			console.log(data.retCode + " " + data.message);
			if (data.retCode != 0) {				
				error.push(data.message);
			}
		}	
	});
});

router.get('/api/script/replay', function(req, res) {	
	var socket = req.app.get('socket');
	
	event.cmd = 'ui/replay-pause';
	socket.emit('event', event);
	res.json({ result: 'ok' });
});

router.get('/api/script/pause', function(req, res) {	
	var socket = req.app.get('socket');
	
	event.cmd = 'ui/replay-pause';
	socket.emit('event', event);
	res.json({ result: 'ok' });
});

router.get('/api/ui/dialog/generalsetting', function(req, res) {	
	var socket = req.app.get('socket');
	
	event.cmd = 'ui/open-gs';
	socket.emit('event', event);
	res.json({ result: 'ok' });
});

router.get('/api/ui/dialog/parameter', function(req, res) {	
	var socket = req.app.get('socket');
	
	event.cmd = 'ui/open-pd';
	socket.emit('event', event);
	res.json({ result: 'ok' });
});

router.get('/api/listen/OIA', function(req, res) {
	var socket = req.app.get('socket');
	addListener('step/assist/request', false, socket);
	res.json({ result: 'ok' });
});

router.get('/api/listen/OIA/remove', function(req, res) {
	var socket = req.app.get('socket');
	removeListener('step/assist/request', socket);
	res.json({ result: 'ok' });
});

router.get('/api/listen/OIA/check', function(req, res) {
	res.json(checkListener('step/assist/request'));
});

function removeListener(event, socket){
	var listener = {
		cmd: event,
	}
	socket.emit('remove_listener', listener);
}

function addListener(event, once, socket){
	var listener = {
		cmd: event,
		once: once,
	}
	socket.emit('listen', listener);
	
	socket.on('answer', function (data) {
		console.log('get answer');
		global.listen_results.push({ event: data.cmd, retCode: 0 });
	});	
}

function checkListener(event){	
	if (global.listen_results.length == 0)
	{
		return { event: event, retCode: null };
	}
	else if (global.listen_results.contains(event))
	{	
		var listened_event = global.listen_results.get(event);
		if (listened_event != null)
		{		
			var retCode = listened_event.retCode;
			global.listen_results.delete(event);
		}
		return { event: event, retCode: retCode };		
	}
	else
	{
		return { event: event, retCode: null };
	}
}

Array.prototype.contains = function ( needle ) {
   for (i in this) {
       if (this[i].event == needle) return true;
   }
   return false;
}

Array.prototype.get = function ( needle ) {
   for (i in this) {
       if (this[i].event == needle) return this[i];
   }
   return null;
}

Array.prototype.delete = function ( needle ) {
   for (i in this) {
       if (this[i].event == needle) delete this[i];
   }
}

module.exports = router;
