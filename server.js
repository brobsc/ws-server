const WebSocket = require('ws');

class Server {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.users = {};
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const msg = JSON.parse(message);
        if (!msg.type) {
          console.log('Invalid message');
          console.log(msg)
          return;
        }
        switch (msg.type) {
          case 'signin':
            this.handleUserConnection(msg, ws);
            this.broadcastUsers();
            break;
          case 'offer':
            this.handleOffer(msg);
            break;
          case 'answer':
            this.handleAnswer(msg);
            break;
          case 'newCandidate':
            this.handleNewIceCandidate(msg);
            break;
          case 'requestUsers':
            this.handleUsersRequest(msg);
            break;
          case 'callRequest':
            this.handleCallRequest(msg);
            break;
          case 'callAnswer':
            this.handleCallAnswer(msg);
            break;
          default:
            console.log(`Message of type: ${msg.type} not handled.`);
            break;
        }
      });
      ws.on('close', (connection) => {
        const user = Object.keys(this.users).find(k => this.users[k] === ws);
        delete this.users[user];
        console.log(`${user} has disconnected.`);
        this.broadcastUsers();
      });
    });
  }

  handleUsersRequest(msg) {
    const requester = msg.name;
    const users = Object.keys(this.users);
    console.log(`${requester} has requested online users`)
    this.users[requester].send(JSON.stringify({
      type: 'userList',
      users: users,
    }));
  }

  broadcastUsers() {
    const users = Object.keys(this.users);
    console.log(`Broadcasting userList to ${users.length} users.`)
    this.wss.clients.forEach((client) => {
      console.log(`Sending users to ${Object.keys(this.users).find(u => this.users[u] === client)}`)
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'userList',
          users: users,
        }));
      }
    });
  }

  handleNewIceCandidate(msg) {
    console.log(`${msg.name} has sent candidate to ${msg.dest}`);
    if (msg.dest in this.users) {
      this.users[msg.dest].send(JSON.stringify(msg));
    }
  }

  handleUserConnection(msg, ws) {
    console.log(`${msg.name} has connected`);
    this.users[msg.name] = ws;
  }

  handleOffer(msg) {
    console.log(`${msg.name} has rpc-offered ${msg.dest}`);
    if (msg.dest in this.users) {
      this.users[msg.dest].send(JSON.stringify({
        type: msg.type,
        sdp: msg.sdp,
        name: msg.name,
      }));
    }
  }

  handleAnswer(msg) {
    console.log(`${msg.dest} has rpc-answered`);
    if (msg.dest in this.users) {
      this.users[msg.dest].send(JSON.stringify({
        type: msg.type,
        sdp: msg.sdp,
        name: msg.name,
      }));
    }
  }

  handleCallRequest(msg) {
    console.log(`${msg.name} has called ${msg.dest}`);
    if (msg.dest in this.users) {
      this.users[msg.dest].send(JSON.stringify({
        type: msg.type,
        sdp: msg.sdp,
        name: msg.name,
      }));
    }
  }

  handleCallAnswer(msg) {
    console.log(`${msg.name} has been answered by ${msg.dest}`);
    if (msg.dest in this.users) {
      this.users[msg.dest].send(JSON.stringify({
        type: msg.type,
        sdp: msg.sdp,
        name: msg.name,
      }));
    }
  }
}

new Server(8090);

module.exports.Server = Server;
