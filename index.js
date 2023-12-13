const Brutal = require('./brutal/brutal');
var bots = 730;
var server = "wss://158.69.123.15:9096";
var nickname = ".";




for(let i = 0; i < bots; i++) {
    try {

        let bot = new Brutal({
            address: server,
            nick: nickname,
            autoplay: false     
        })
        


setInterval(() => {
    bot.net.sendInput(Math.random() * 6 , 1)

}, 100);
setInterval(() => {
    bot.net.sendClick(true);
    setTimeout(() => {
        bot.net.sendClick(false);
    }, 200);
}, 100);

setInterval(() => {
    bot.net.leave();
    bot.net.sendNick();
}, 5000);

  
    } catch (error) {
        console.error(`Error with Bot${i + 1}:`, error.message);
        
        continue; 
    }
}

