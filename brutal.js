const TinyEmitter = require('./TinyEmitter.js');
const WebSocket = require('ws');
const fetch = require('node-fetch');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const SocksProxyAgent = require('socks-proxy-agent'); //we are using socks proxies
const url = require('url');
const fs = require('fs');

var maxPerProxy = 3; // not recommended more than 3

let connectedBots = 0;

var sockstype = 4; //socks proxies type

function loadProxies(filePath) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    const proxies = {};
    lines.forEach(line => {
        proxies[line.trim()] = 0; 
    });
    return proxies;
}

const proxies = loadProxies('./proxies.txt');

console.log("Brutal.io Bots v1.0 - made by @electrdiode - https://github.com/electrof/brutal-io-bots")
console.log("Starting bots...")

function randomProperty(obj) {
    var keys = Object.keys(obj);
    return keys[keys.length * Math.random() << 0];
};
function getProxy() {
    let proxy = randomProperty(proxies);
    if (proxies[proxy] >= maxPerProxy) {
        delete proxies[proxy];
        return getProxy();
    } else {
        proxies[proxy]++;
      //  console.log("Using proxy:", proxy);
        return proxy;
    }
}


class Brutal extends TinyEmitter {
    constructor(options = {}) {
        super();
        this.party = options.party;
        this.nick = options.nick;
        this.address = options.address;
        this.ws = null;
        this.room = null;
        this.ready = false;
        this.id = 0;
        this.playing = false;
        this.rank = 0;
        this.score = 0;
        this.autoplay = options.autoplay;
        this.leaderboard = [];
        this.map = [];
        this.country = options.country || "CL";

        this.opcodes = {
            client: {
                OPCODE_PING: 0x00,
                OPCODE_HELLO: 0x01,
                OPCODE_HELLO_BOT: 0x02,
                OPCODE_ENTER_GAME: 0x03,
                OPCODE_LEAVE_GAME: 0x04,
                OPCODE_INPUT: 0x05,
                OPCODE_INPUT_BRAKE: 0x06,
                OPCODE_AREA_UPDATE: 0x07,
                OPCODE_CLICK: 0x08
            },
            server: {
                OPCODE_PONG: 0x00,
                OPCODE_MAP_CONFIG: 0xA0,
                OPCODE_ENTERED_GAME: 0xA1,
                OPCODE_ENTITY_INFO_V1: 0xB4,
                OPCODE_ENTITY_INFO_V2: 0xB3,
                OPCODE_EVENTS: 0xA4,
                OPCODE_LEADERBOARD_V1: 0xA5,
                OPCODE_LEADERBOARD_V2: 0xB5,
                OPCODE_MINIMAP: 0xA6
            },
            event: {
                EVENT_DID_KILL: 0x01,
                EVENT_WAS_KILLED: 0x02
            },
            entity: {
                ENTITY_ITEM: 4,
                ENTITY_PLAYER: 5,
                ENTITY_COLLIDER: 1
            },
            sub_entity: {
                SUB_ENTITY_ITEM_ATOM: 0,
                SUB_ENTITY_ITEM_ENERGY: 1,
                SUB_ENTITY_ITEM_TRI_PLUS: 2,
                SUB_ENTITY_ITEM_TRI_MINUS: 3,
                SUB_ENTITY_ITEM_REDFLAIL: 4
            }
        }

this.net = {
    findServer(party) {
        return new Promise((resolve, reject) => {
            fetch("https://master.brutal.io", {
                method: "put",
                body: this.country + (party ? `;` + party : "")
            }).then(i => i.text()).then(res => {
                if(res == "0") return reject("Link expired!");
                if(res == "1") return reject("Server is full.");

                let room = +res.split("/")[1].split("!")[0];
                let address = res.split("/")[0].split(":")[0];
                let port = 8080 + room;

                return resolve({
                    address: `${address}:${port}`,
                    room,
                    party: res.split("/")[1].split("!")[1]
                })
            })
        });
    },
    onClose: () => {
        this.emit("close");
        this.ready = false;
        this.playing = false;
        this.world.connect();
    },
    onOpen: () => {
        this.emit("open");
    
        this.net.sendHello();
        this.net.ping();
        this.ready = true;
        this.net.sendNick(this.nick || "<no-name>");
    },
    onMessage: msg => {
        let view = new DataView(msg.data);
        let op = view.getUint8(0);
    
        switch(op) {
            case this.opcodes.server.OPCODE_ENTERED_GAME: {
                let offset = 1;
                this.id = view.getUint32(offset, true); // This is my ID
    
                this.playing = true;
    
                this.emit("id", this.id);
               // console.log(this.id);
            }
case this.opcodes.server.OPCODE_ENTITY_INFO_V1:
                    case this.opcodes.server.OPCODE_ENTITY_INFO_V2: {
                        this.world.updateEntities(view, op);
                        break;
                    }
                    case this.opcodes.server.OPCODE_EVENTS: {
                        this.world.processEvents(view);
                        break;
                    }
                    case this.opcodes.server.OPCODE_LEADERBOARD_V1:
                    case this.opcodes.server.OPCODE_LEADERBOARD_V2: {
                        let offset = this.world.processLeaderboard(view, op);
                        this.emit("leaderboard", this.leaderboard);
                     // console.log("leaderboard", this.leaderboard);
                        let id = view.getUint16(offset, true);
                        offset += 2;

                        if(id > 0) {
                            let score;
                            if(op === this.opcodes.server.OPCODE_LEADERBOARD_V1){
                                score = view.getUint16(offset, true);
                                offset += 2;
                            } else {
                                score = view.getUint32(offset, true);
                                offset += 4;
                            }

                            let rank = view.getUint16(offset, true);
                            offset += 2;

                            this.rank = rank;
                            this.score = score;

                            this.emit("rank", {rank, score});

                        } else {
                            this.rank = 0;
                            this.score = 0;

                            this.emit("rank", {rank: 0, score: 0});
                        }
                    }
                    case this.opcodes.server.OPCODE_MINIMAP: {
                        this.world.updateMapInfo(view);
                    }
                }
            },
            sendHello: () => {
                if(!this.ws || this.ws.readyState !== 1) return;
                let arr = new ArrayBuffer(5);
                let dv = new DataView(arr);

                dv.setUint8(0, 1);
                dv.setUint16(1, 1680 / 10 * 1, 1);
                dv.setUint16(3, 1050 / 10 * 1, 1);

                this.emit("hello");
                this.ws.send(arr);
            },
            ping: () => {
                if(!this.ws || this.ws.readyState !== 1) return;
                let arr = new ArrayBuffer(1);
                (new DataView(arr)).setUint8(0, 0);

                this.emit("ping");
                this.ws.send(arr);
            },
sendNick: (nick = this.nick) => {
    if (!this.ws || this.ws.readyState !== 1) return;
    let arr = new ArrayBuffer(3 + 2 * nick.length),
        dv = new DataView(arr);
    dv.setUint8(0, 3);
    for (let e = 0; e < nick.length; ++e) {
        dv.setUint16(1 + 2 * e, nick.charCodeAt(e), 1);
    }
    this.ws.send(arr);
},


            sendInput: (angle, throttle) => {
                if(!this.ws || this.ws.readyState !== 1) return;
                let arr = new ArrayBuffer(10),
                    dv = new DataView(arr);
                dv.setUint8(0, 5);
                dv.setFloat64(1, angle, 1);
                dv.setUint8(9, throttle, 1);
                this.ws.send(arr);
            },
            sendClick: hold => {
                if(!this.ws || this.ws.readyState !== 1) return;
                let arr = new ArrayBuffer(2),
                    dv  = new DataView(arr);
                dv.setUint8(0, 8);
                hold ? dv.setUint8(1, 1) : dv.setUint8(1, 0);
                this.ws.send(arr)
            },
            leave: () => {
                if(!this.ws || this.ws.readyState !== 1) return;
                if(this.autoplay)setTimeout(this.net.sendNick, 100);
                var arr = new ArrayBuffer(1);
                (new DataView(arr)).setUint8(0, 4);
                this.ws.send(arr)
            }
        };
        this.world = {
            king: {
                id: null,
                x: 0,
                y: 0
            },
            connect: () => {
                if(!this.address) return;
        
        let proxy = getProxy();
        let proxyUrl = url.parse(`socks${sockstype}://${proxy}`);
        let agent = new SocksProxyAgent(proxyUrl);

        this.ws = new WebSocket(this.address, { agent: agent });
                this.ws.binaryType = "arraybuffer";


                this.wasSuccessfullyConnected = false;

                this.ws.onopen = () => {
                    this.wasSuccessfullyConnected = true; 
                    connectedBots++;
                    console.log(`Connected bots: ${connectedBots}`);
                
                    if (typeof this.net.onOpen === "function") {
                        this.net.onOpen();
                    }
                };
                
                this.ws.onclose = () => {
                    if (this.wasSuccessfullyConnected) {
                        connectedBots--;
                        console.log(`Connected bots: ${connectedBots}`);
                    }
                
                    if (typeof this.net.onClose === "function") {
                        this.net.onClose();
                    }
                };
                
    this.ws.onmessage = this.net.onMessage;
                this.ws.onmessage = this.net.onMessage;
                this.ws.onerror = (error) => {
        //            console.error("WebSocket error:", error.message);                   
                };
                
            },
            entities: {},
            updateMapInfo: view => {
                let offset = 1;
                let count = view.getUint16(offset, true);
                offset += 2;
                let mapInfo = [];
                try {
                    for(let i = 0; i < count; i++) {
                        let x = view.getUint8(offset++, true);
                        let y = view.getUint8(offset++, true);
                        let r = view.getUint8(offset++, true);
                        let playerInfo = {x: x, y: 256-y, r: r};
                        mapInfo.push(playerInfo);
                    }
                    this.map = mapInfo;
                    this.emit("map", this.map);
                } catch(e) {}
            },
            processLeaderboard: (view, op) => {
                let offset = 1; // Skip opcode

                let leaderboardInfo = [];
                let containsData = false;
                while(true) {
                    let id = view.getUint16(offset, true);
                    offset += 2;
                    if(id === 0) break;

                    containsData = true;

                    let score;
                    if(op === this.opcodes.server.OPCODE_LEADERBOARD_V1) {
                        score = view.getUint16(offset, true);
                        offset += 2;
                    } else {
                        score = view.getUint32(offset, true);
                        offset += 4;
                    }

                    let res = this.utils.getString(view, offset);
                    let nick = res.nick;
                    offset = res.offset;

                    let leaderboardItemInfo = {};
                    leaderboardItemInfo.nick = this.utils.getPlayerName(nick);
                    leaderboardItemInfo.score = score;
                    leaderboardItemInfo.id = id;
                    leaderboardInfo.push(leaderboardItemInfo);
                }

                if(containsData) {
                    this.leaderboard = leaderboardInfo;
                }

                return offset;
            },
            processEvents: view => {
                let offset = 1;

                while(true) {
                    let byte_ = view.getUint8(offset++, true);

                    if(byte_ === 0) break;

                    switch(byte_) {
                        case this.opcodes.event.EVENT_DID_KILL: {
                            let id = view.getUint16(offset, true);
                            offset += 2;

                            let res = this.utils.getString(view, offset);
                            let nick = res.nick;
                            offset = res.offset;

                            this.emit("kill", {id, nick});
                          //  console.log("killed", {id, nick});
                            break;
                        }
                        case this.opcodes.event.EVENT_WAS_KILLED: {
                            let id = view.getUint16(offset, true);
                            offset += 2;

                            let res = this.utils.getString(view, offset);
                            let nick = res.nick;
                            offset = res.offset;

                            this.playing = false;
                            this.emit("died", {id, nick});
                           // console.log("died, deleted by", {id, nick});

                            if(this.autoplay) setTimeout(this.net.sendNick);
                            break;
                        }
                        
                        
                    }
                }
            },
            updateEntities: (view, op) => {
                let offset = 1;
            }
        }
        this.utils = {
            getString(view, offset) {
                let nick = "";
                for(;;) {
                    let v = view.getUint16(offset, true);
                    offset += 2;
                    if(v === 0) break;
                    nick += String.fromCharCode(v);
                }
                return {
                    nick: nick,
                    offset: offset
                };
            },
            getPlayerName(name) {
                let playerName = name;
                if(playerName == '') playerName = '<Unnamed>';
                return playerName;
            }
        }

        this.init();
    }
    async init() {
        if(!this.address) {
            let server = await this.net.findServer(this.party);

            this.room = server.room;
            this.party = server.party;
            this.address = server.address;

            this.emit("server", server);

            this.world.connect();
        } else this.world.connect();

        setInterval(this.net.ping, 150);
    }
}

module.exports = Brutal;
