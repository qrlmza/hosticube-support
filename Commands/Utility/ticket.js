const { SlashCommandBuilder, ChannelType, EmbedBuilder, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const color = require('colors/safe');
const { all } = require('axios');
require('dotenv').config();
const formatDate = require('../../Scripts/getDate.js');
const db = require('../../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Ouvrir un ticket de support.')
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription("Pourquoi nous contactez-vous ?")
                .addChoices(
                    { name: 'Problème Technique', value: 'technique' },
                    { name: 'Problème de Facturation', value: 'facturation' },
                    { name: 'Demande d\'aide', value: 'support' },
                    { name: 'Commande de service', value: 'boutique' }
                )
                .setRequired(true)
        ),
    
    async execute(interaction) {
        
        const reason = interaction.options.getString('raison');
        const user = interaction.user;
        const now = formatDate();

        const parent = "1415370672766451746";

        // Récupération des informations utilisateur depuis la base de données
        let userInfo = null;
        let userServers = [];
        try {
            // Récupérer l'email, uuid et id de l'utilisateur
            const [users] = await db.query(
                'SELECT id, email, uuid FROM users WHERE discord_id = ?',
                [user.id]
            );

            if (users.length > 0) {
                userInfo = users[0];
                // Récupérer tous les serveurs de l'utilisateur
                const [servers] = await db.query(
                    'SELECT uuidShort, name FROM servers WHERE owner_id = ?',
                    [userInfo.id]
                );
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
                flags: MessageFlags.Ephemeral,
            });
        }

        try {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: parent,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles'],
                    }
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle('<:newTicket:1418954216000589854> • Un nouveau ticket a été ouvert !')
                .setDescription(`> Ouvert par: <@${user.id}> \n> Date d'ouverture: \`${now}\`. \n> Type de ticket: \`${reason}\`.`)
                .setColor('#9E3737')
                .setTimestamp();

            if (userInfo) {
                let userFields = [
                    { name: '✉️ Email', value: `\`${userInfo.email}\``, inline: true },
                    { name: '📁 UUID', value: `\`${userInfo.uuid}\``, inline: true },
                    { name: '⛓️‍💥 Database ID', value: `\`${userInfo.id}\``, inline: false }
                ];

                if (userServers.length > 0) {
                    const serversList = userServers.map(server => 
                        `\`${server.uuidShort}\` - ${server.name}`
                    ).join('\n');
                    userFields.push({ name: 'Serveurs', value: serversList, inline: false });
                } else {
                    userFields.push({ name: 'Serveurs', value: 'Aucun serveur trouvé', inline: false });
                }

                embed.addFields(userFields);
            }

            embed.setFooter({ text: `Identifiant de ticket: ${user.id}`, iconURL: user.displayAvatarURL() })

            const message = await channel.send({
                content: `<@${user.id}> • <@&1415370671424278644>`,
                embeds: [embed],
            });

            message.pin();

            await interaction.reply({
                content: `<:newTicket:1418954216000589854> • Votre ticket a bien été ouvert ! Rendez-vous dans le salon ${channel}.`,
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            console.error(color.red("⚠️ Une erreur est survenue lors de l'ouverture d'un ticket de support." + error));
            interaction.reply("⚠️ • Une erreur est survenue lors de l'ouverture de votre ticket...");
        }
    },
};