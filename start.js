// Import section
import WebSocket, { WebSocketServer } from "ws";
import express from "express"
import { fileURLToPath } from "url";
import { dirname } from "path";
import easymidi from "easymidi";
import nanotimer from "nanotimer";

// Manually define __dirname function as it was not available from the start
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants section
const web_app_port = 3000;
const ws_server_ip = "127.0.0.1";
const ws_server_port = 3061;
const midi_device_name = "Z-BASE";
const app = express();

// Define a base address for the starting page of the appplication
app.get("/", (req, res) => {
  res.sendFile("./web_app/index.html", { root: __dirname });
});

// Serve javascript pages of the application
app.use(express.static("web_app"));

// Start web server for frontend application
app.listen(web_app_port, () => console.log(`Your MIDI base clock is available on port ${web_app_port}`));

// Start a virtual MIDI device
var midi_output = new easymidi.Output(midi_device_name, true);

// Set initial tempo for the MIDI clock (60 BPM with 24 PPQ)
var getTimeout = function(bpm){
  return Math.round((2500000 - (bpm - 20) * 13.75) / bpm).toString() + "u";
}
var timer = new nanotimer();
var timeout = getTimeout(180);
var ticks = 0;
var ticking = false;

// Define metronome function to tick forever and send MIDI clock messages
var metronome = function(){
  timer.setTimeout(metronome, [], timeout);
  midi_output.send("clock");
  if(ws.readyState === WebSocket.OPEN){
    ws.send(JSON.stringify({
    "args":[
      {"type": "s", "value": "ppq"},
      {"type": "f", "value": ticks}]
    }));
  }
  if(ticking){
    if(ticks < 23) ticks++;
    else ticks = 0;    
  }
}

// Start a websocket server and listen to incoming messages
const wss = new WebSocketServer({ port: ws_server_port });
wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    let parse = JSON.parse(data);
    let cmd = parse.args[0].value;
    switch(cmd){
      case "settempo":
        timeout = getTimeout(parse.args[1].value);
        break;
      case "ppq":
        wss.clients.forEach(function each(client) {
          if(client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(parse));
          }
        });
        break;
      case "start":
        ticks = 0;
        midi_output.send("start");
        ticking = true;
        break;
      case "stop":
        midi_output.send("stop");
        ticking = false;
        break;
      case "continue":
        midi_output.send("continue");
        ticking = true;
        break;
    }
    if(parse.args[0].value == "noteon" || parse.args[0].value == "noteoff"){
      midi_output.send(parse.args[0].value, {
        note: parse.args[1].value,
        velocity: parse.args[2].value,
        channel: parse.args[3].value
      });
    }
    else if(parse.args[0].value == "clock") midi_output.send("clock");
  });
  ws.send("Connected to sequencer backend");
});

// Start a websocket client to forward OSC messages
const ws = new WebSocket("ws://" + ws_server_ip + ":" + String(ws_server_port));

// Start the metronome
metronome(true);