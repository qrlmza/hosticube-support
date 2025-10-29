const { Client, GatewayIntentBits, Partials, ChannelType, EmbedBuilder, PermissionFlagsBits, PermissionsBitField  } = require("discord.js");
const fs = require("fs");
const path = require("path");
var color = require("colors/safe");
require("dotenv").config({ quiet: true });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

const commandsHandler = require("./Handlers/commandsHandler");
commandsHandler(client);

console.log(color.magenta("🚀 Chargement des handlers..."));
const eventsPath = path.join(__dirname, "Handlers");
const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

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
    try {
        if (!message || message.author?.bot) return;
        if (!message.guild) return;

        const logsChannelId = process.env.TICKET_LOGS_CHANNEL;
        const content = (message.content || '').trim();

        if (content !== 's!close') return;

        const ch = message.channel;
        if (
            !ch ||
            (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.PublicThread && ch.type !== ChannelType.PrivateThread) ||
            !ch.name?.startsWith('ticket-')
        ) {
            return message.delete().catch(() => { });
        }

        const botPerms = message.guild.members.me?.permissionsIn(ch);
        if (!botPerms?.has(PermissionsBitField.Flags.ManageChannels)) {
            return ch.send("Je n'ai pas la permission de fermer ce ticket (ManageChannels manquante).").catch(() => { });
        }

        await ch.send('<:deleteTicket:1418954214402687047> • Fermeture du ticket dans 5 secondes…').catch(() => { });

        const logEmbed = new EmbedBuilder()
            .setColor('#9E3737')
            .setDescription(`<:newTicket:1418954216000589854> • ${message.author} a fermé un ticket → <#${ch.id}>.`)

        if (logsChannelId) {
            try {
                const logChannel = await message.client.channels.fetch(logsChannelId);
                if (logChannel && 'send' in logChannel) {
                    await logChannel.send({ embeds: [logEmbed] }).catch(() => { });
                } else {
                    console.warn('⚠️ Le channel de logs est introuvable ou invalide.');
                }
            } catch (err) {
                console.error('⚠️ Impossible de récupérer le channel de logs:', err);
            }
        } else {
            console.warn("⚠️ Aucune variable d'environnement TICKET_LOGS_CHANNEL définie.");
        }

        await new Promise((r) => setTimeout(r, 5000));
        await ch.delete('Fermeture de ticket par commande s!close').catch((err) => {
            console.error('⚠️ Erreur lors de la suppression du salon:', err);
        });
    } catch (err) {
        console.error('❌ Erreur handler s!close:', err);
    }
});

client.login(process.env.APP_TOKEN);
