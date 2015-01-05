// (c) Copyright 2013 Hewlett-Packard Development Company, L.P.
(function() {

"use strict";

function subscribeSocketEvents() {
	socket = io.connect('http://localhost:7001',{'reconnection limit': 500});
	var processId;
	socket.on('connect', function(){		
		processId = Ambiance.getStringVal("ProcessId");
		if (processId.length === 0)
			socket.emit('addclient', {type : Ambiance.getStringVal("TC_ADDIN")});
		else
			socket.emit('addclient', {type : Ambiance.getStringVal("TC_ADDIN"), pid : parseInt(processId)});
	});
	
	socket.on('event', function(data) {
		Event.dispatch(data.cmd, window, data.args);
	});
	
	socket.on('listen', function(data) {		
		if (data.once)
		{
			if( data.timeout != undefined)
			{
				setTimeout(function(){
					data.retCode = 9999;
					socket.emit('answer', data);			
					Query.removeEventListener(data.cmd, onListener);					
				}, data.timeout * 1000);
			}
			
			Query.addOnetimeEventListener(data.cmd,	onListener);
		}
		else
		{
			Query.addEventListener(data.cmd, onListener);
		}
	});
	
	socket.on('remove_listener', function(data) {		
	    Query.removeEventListener(data.cmd, onListener);
	});
}

function onListener(e){	
	var data = {
		cmd: e.type,
		retCode: e.retCode,
		message: e.toString(),
	}
	socket.emit('answer', data);
}


function loadSocketIo() {
	function encReadyCountAndConnectionToServerIfReady(e) {
		readyCount++;
		if (readyCount == 2)
			subscribeSocketEvents();
	}
	var readyCount = 0;
	
	Query.addEventListener("RRE/loaded", encReadyCountAndConnectionToServerIfReady);
	
	var headID = document.getElementsByTagName("head")[0];
	var newScript = document.createElement('script');
	
	newScript.type = 'text/javascript';
	newScript.onload = encReadyCountAndConnectionToServerIfReady;
	newScript.src = "http://localhost:7001/socket.io/socket.io.js";
	
	headID.appendChild(newScript);
}

var addInName = Ambiance.getStringVal("TC_ADDIN");
var socket = null;
loadSocketIo();

})();