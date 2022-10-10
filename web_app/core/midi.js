function Midi({baseUrl, basePort, callback}){
	this.baseUrl = baseUrl || "127.0.0.1";
	this.basePort = basePort || 3061;
	this.callback = callback || null;
	this.ws = new WebSocket("ws://" + this.baseUrl + ":" + this.basePort);
	this.pending = [];
	this.dispatcher = [];
	this.ws.onopen = this.wsOK.bind(this);
	this.ws.onerror = this.wsKO.bind(this);
	this.ws.onmessage = this.receive.bind(this);
	this.ws.onclose = function(event) {
  	console.log("WebSocket is closed now.");
	}
}

Midi.prototype.wsOK = function(data) {
  while(this.pending.length > 0) this.send(this.pending.pop());
}

Midi.prototype.wsKO = function(data) {
  alert("Problem connecting to websocket server 'ws://" + this.baseUrl + ":" + this.basePort + "'. No OSC messages will be sent until you start the server and refresh this page.");
}

Midi.prototype.send = function(data) {
  if(this.ws.readyState !== 1) this.pending.push(data)
  else {
  	formattedData = [];
  	data.forEach(function(value) {
  		valueType = typeof value;
  		if(valueType == "string") type = "s";
  		else if(valueType == "number") type = "f";
      formattedData.push({ "type": type, "value": value });
  	})
	  msg = { args:formattedData };
	  this.ws.send(JSON.stringify(msg));
  }
}

Midi.prototype.receive = function(event) {
  try {
  	if(this.callback){
  		msg = JSON.parse(event.data)
  		args =[];
  		msg.args.forEach(element => {
      	args.push(element.value);
  		});
  		this.callback(args);
  	}
  }
  catch(e){
    console.log(event.data);
  }
}