# Bots for Brutal.io

## Steps

1. You need to install **node.js** for the bots to work (at [https://nodejs.org](https://nodejs.org))

2. Execute **install.bat**

3. Update the **proxies.txt** file, you can get free proxies at [https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=10000&country=all](https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=10000&country=all)

4. Edit **index.js** and change the address to which you want the bots to connect. To get the address, press **F12** or **Fn + F12** on the Brutal.io website, go to 'Network' and press 'WS' option, then reload the website and copy the URL. Also, you can edit the number of bots you want to spawn in the game.

5. Execute **run.bat** and bots they should work.

## API (only if you understand coding)

1. **sendInput()**
   Send the angle and throttle of the bot (throttle is whether the bot is moving or not, the value is 0 for it to be still and 1 for it to move, angle is the angle of the bot, which can be a value between 0 and approx 6). For example:

   ```javascript
   bot.net.sendInput(6 , 1)
   ```

2. **sendClick()**
   SendClick is used to attract flail. If it is true, it is attracted, and if false, it is not. For example:

   ```javascript
   bot.net.sendClick(true)
   ```

3. **sendNick()**
   SendNick is used for the bot to join the game while sending the bot name data.

4. **leave()**
   Leave is used to leave the party.
