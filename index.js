const Brutal = require('./brutal');
var bots = 730;
var server = "wss://158.69.123.15:9096";
var nickname = "Brutal.io bots";




for(let i = 0; i < bots; i++) {
    try {

        let bot = new Brutal({
            address: server,
            nick: nickname,
            autoplay: true    
        })
        


setInterval(() => {   
    bot.net.sendInput(Math.random() * 6 , 1)
}, 100);
 
    } catch (error) {
        console.error(`Error with Bot${i + 1}:`, error.message);
        
        continue; 
    }
}

