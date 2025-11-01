const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const color = require('colors/safe');
const { getPool } = require('../../db');
const formatDate = require('../../Scripts/getDate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist un utilisateur par ID Discord, récupère son email et enregistre en BDD.')
        .addStringOption(o => o.setName('id').setDescription('ID Discord de la cible').setRequired(true))
        .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const discordId = interaction.options.getString('id', true).trim();
        const raison = interaction.options.getString('raison', true);
        const date = formatDate();
        const authorId = interaction.user.id;

        if (!/^\d{17,20}$/.test(discordId)) {
            return interaction.reply({ content: '❌ ID Discord invalide.', flags: MessageFlags.Ephemeral });
        }

        try {
            const panelPool = getPool('panel');
            const [rows] = await panelPool.execute('SELECT email FROM users WHERE discord_id = ?', [discordId]);
            const email = rows[0]?.email || 'NaN';

            const targetPool = getPool('s7_hosticube');
            await targetPool.execute(
                'INSERT INTO blacklist (email, userId, `date`, authorId) VALUES (?, ?, ?, ?)',
                [email, discordId, date, authorId]
            );

            const emailTxt = email ? `Email: ${email}` : 'Email: introuvable';
            await interaction.reply({
                content: `🔒 ID ${discordId} blacklisté le ${date}\n${emailTxt}\nRaison: ${raison}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (e) {
            await interaction.reply({ content: '❌ Erreur lors de l’enregistrement en base.', flags: MessageFlags.Ephemeral });
            console.log(color.red(`❎ Erreur lors de la blacklist: ${e}`));
        }
    },
};
