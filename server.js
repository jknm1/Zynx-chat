const http = require("http");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Zynx Chat</title>
    <style>
      body {
        font-family: Arial;
        background: black;
        color: white;
        text-align: center;
      }

      h2 {
        color: #ff2e88;
        letter-spacing: 2px;
      }

      #chat { display:none; }

      #messages {
        height:300px;
        overflow:auto;
        border:1px solid #333;
        margin:10px;
        padding:10px;
        background:#111;
      }

      input {
        padding:10px;
        margin:5px;
        border:none;
        background:#222;
        color:white;
      }

      button {
        padding:10px;
        background:#ff2e88;
        border:none;
        color:white;
        cursor:pointer;
      }
    </style>
  </head>
  <body>

    <h2>ZYNX CHAT</h2>

    <div id="login">
      <input id="number" placeholder="Enter your number" />
      <button onclick="join()">Enter</button>
    </div>

    <div id="chat">
      <h3 id="room"></h3>
      <div id="messages"></div>
      <input id="msg" placeholder="Type message..." />
      <button onclick="send()">Send</button>
    </div>

    <script>
      let ws;
      let number;

      function join() {
        number = document.getElementById("number").value;
        ws = new WebSocket("ws://" + location.host);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "join", number }));
          document.getElementById("login").style.display = "none";
          document.getElementById("chat").style.display = "block";
          document.getElementById("room").innerText = "Room: " + number;
        };

        ws.onmessage = (msg) => {
          const data = JSON.parse(msg.data);
          const div = document.createElement("div");
          div.innerText = data.message;
          document.getElementById("messages").appendChild(div);
        };
      }

      function send() {
        const message = document.getElementById("msg").value;
        ws.send(JSON.stringify({ type: "message", message }));
        document.getElementById("msg").value = "";
      }
    </script>

  </body>
  </html>
  `);
});

const wss = new WebSocket.Server({ server });
const rooms = {};

wss.on("connection", (ws) => {
  let room = null;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "join") {
      room = data.number;
      if (!rooms[room]) rooms[room] = [];
      rooms[room].push(ws);
    }

    if (data.type === "message" && room) {
      rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ message: data.message }));
        }
      });
    }
  });

  ws.on("close", () => {
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter(c => c !== ws);
    }
  });
});

server.listen(3000, () => {
  console.log("Zynx Chat running on http://localhost:3000");
});
