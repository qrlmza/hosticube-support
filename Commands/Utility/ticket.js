const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const color = require('colors/safe');
require('dotenv').config();
const formatDate = require('../../Scripts/getDate.js');
const db = require('../../db');
const logsChannelId = process.env.TICKET_LOGS_CHANNEL;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Ouvrir un ticket de support.')
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Pourquoi nous contactez-vous ?')
                .addChoices(
                    { name: 'Problème Technique', value: 'technique' },
                    { name: 'Problème de Facturation', value: 'facturation' },
                    { name: "Demande d'aide", value: 'support' },
                    { name: 'Commande de service', value: 'boutique' }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const reason = interaction.options.getString('raison');
        const user = interaction.user;
        const now = formatDate();
        const parent = '1415370672766451746';

        let userInfo = null;
        let userServers = [];
        try {
            const [users] = await db.query('SELECT id, email, uuid FROM users WHERE discord_id = ?', [user.id]);
            if (users.length > 0) {
                userInfo = users[0];
                const [servers] = await db.query('SELECT uuidShort, name FROM servers WHERE owner_id = ?', [userInfo.id]);
                userServers = servers;
            }
        } catch (dbError) {
            console.error(color.red("⚠️ Erreur lors de la récupération des informations utilisateur: " + dbError));
        }

        const existingChannel = interaction.guild.channels.cache.find(
            channel => channel.name === `ticket-${interaction.user.username}`
        );
        if (existingChannel) {
            return interaction.reply({
                content: `⚠️ Vous avez déjà un ticket ouvert : ${existingChannel}`,
                ephemeral: true
            });
        }

        try {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle('<:newTicket:1418954216000589854> • Un nouveau ticket a été ouvert !')
                .setDescription(`> Ouvert par: <@${user.id}> \n> Date d'ouverture: \`${now}\`. \n> Type de ticket: \`${reason}\`.`)
                .setColor('#9E3737')
                .setTimestamp();

            const logEmbed = new EmbedBuilder()
                .setDescription(`<:newTicket:1418954216000589854> • ${user} a ouvert un ticket → <#${channel.id}>.`)
                .setColor('#379e40');

            if (userInfo) {
                let userFields = [
                    { name: '✉️ Email', value: `\`${userInfo.email}\``, inline: true },
                    { name: '📁 UUID', value: `\`${userInfo.uuid}\``, inline: true },
                    { name: '⛓️‍💥 Database ID', value: `\`${userInfo.id}\``, inline: false }
                ];
                if (userServers.length > 0) {
                    const serversList = userServers.map(s => `\`${s.uuidShort}\` - ${s.name}`).join('\n');
                    userFields.push({ name: 'Serveurs', value: serversList, inline: false });
                } else {
                    userFields.push({ name: 'Serveurs', value: 'Aucun serveur trouvé', inline: false });
                }
                embed.addFields(userFields);
            }

            embed.setFooter({ text: `Identifiant de ticket: ${user.id}`, iconURL: user.displayAvatarURL() });

            const msg = await channel.send({
                content: `<@${user.id}> • <@&1415370671424278644>`,
                embeds: [embed]
            });

            if (logsChannelId) {
                try {
                    const logChannelObj = await interaction.client.channels.fetch(logsChannelId);
                    if (logChannelObj && typeof logChannelObj.send === 'function') {
                        await logChannelObj.send({ embeds: [logEmbed] }).catch(err => console.error(color.red("⚠️ Erreur lors de l'envoi du log : " + err)));
                    } else {
                        console.warn(color.yellow('⚠️ Le channel de logs est introuvable ou invalide.'));
                    }
                } catch (err) {
                    console.error(color.red('⚠️ Impossible de récupérer le channel de logs: ' + err));
                }
            } else {
                console.warn(color.yellow("⚠️ Aucune variable d'environnement TICKET_LOGS_CHANNEL définie."));
            }

            await msg.pin().catch(() => { });
            await interaction.reply({
                content: `<:newTicket:1418954216000589854> • Votre ticket a bien été ouvert ! Rendez-vous dans le salon ${channel}.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(color.red("⚠️ Une erreur est survenue lors de l'ouverture d'un ticket de support." + error));
            interaction.reply({ content: "⚠️ • Une erreur est survenue lors de l'ouverture de votre ticket...", ephemeral: true });
        }
    }
};
