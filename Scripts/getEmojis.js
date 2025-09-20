// Script à lancer avec ton bot connecté
// Place ce fichier dans ton projet et lance-le avec node
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const TOKEN = process.env.APP_TOKEN; // Remplace par le token de ton bot
const GUILD_ID = "1415370671424278643"; // Remplace par l'ID de ton serveur

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const emojis = await guild.emojis.fetch();
    emojis.forEach(emoji => {
        const format = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
        console.log(format);
    });
    client.destroy();
});

client.login(TOKEN);