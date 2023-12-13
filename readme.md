Bots for brutal.io

Steps

1. You need to install node.js for the bots to work (at https://nodejs.org)

2. Execute install.bat

3. Update the proxies.txt file, you can get free proxies at https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=10000&country=all

4. edit index.js and change the address to which you want the bots to connect, to get the address, press f12 or fn + f12 on brutal.io website, go to 'Network' and press 'WS' option, then reload the website and copy the url. Also you can edit the number of bots you want to spawm in game

5. Execute run.bat and bots they should work.

API (only if you understand coding)

1. sendInput()
 send the angle and throttle of the bot (throttle is whether the bot is moving or not, the value is 0 for it to be still and 1 for it to move, angle is the angle of the bot, which can be a value between 0 and approx 6) , for example:

bot.net.sendInput(6 , 1)

2. sendClick()
sendclick is used to attract flail, if it is true, it is attracted, and if false, it is not, for example:

bot.net.sendClick(true)

3. sendNick()

sendNick is used for the bot to join the game, while sending the bot name data.

4. leave()
leave is used to leave the party.


