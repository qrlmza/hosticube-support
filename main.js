const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
var color = require('colors/safe');
require('dotenv').config({ quiet: true });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const commandsHandler = require('./Handlers/commandsHandler');
commandsHandler(client);

console.log(color.magenta('🚀 Chargement des handlers...'));
const eventsPath = path.join(__dirname, 'Handlers');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on('messageCreate', async (message) => {
    if(message.content === "s!close") {
        if (message.channel && message.channel.name && message.channel.name.startsWith('ticket-')) {
            await message.channel.send('<:deleteTicket:1418954214402687047> • Fermeture du ticket dans 5 secondes...');
            setTimeout(async () => {
                await message.channel.delete();
            }, 5000);
        } else {
            await message.delete();
        }
    }
});

client.login(process.env.APP_TOKEN);