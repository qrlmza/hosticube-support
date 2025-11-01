// Commands/Moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🛠️ Permet de bannir un membre du serveur.')
        .addUserOption(option =>
            option
                .setName('utilisateur')
                .setDescription('Utilisateur à bannir :')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription("Pourquoi l'utilisateur doit être banni ?")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "❌ Cette commande n'est utilisable qu'en serveur.", flags: MessageFlags.Ephemeral });
        }

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: "❌ Tu n'as pas la permission d'utiliser cette commande.", flags: MessageFlags.Ephemeral });
        }

        const me = interaction.guild.members.me;
        if (!me?.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: "❌ Je n'ai pas la permission de bannir des membres.", flags: MessageFlags.Ephemeral });
        }

        const targetUser = interaction.options.getUser('utilisateur', true);
        const reason = interaction.options.getString('raison', true);

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: "❌ Tu ne peux pas te bannir toi‑même.", flags: MessageFlags.Ephemeral });
        }

        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({ content: "❌ Tu ne peux pas me bannir.", flags: MessageFlags.Ephemeral });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: "❌ Impossible de trouver ce membre sur le serveur.", flags: MessageFlags.Ephemeral });
        }

        if (targetMember.id === interaction.guild.ownerId) {
            return interaction.reply({ content: "❌ Impossible de bannir le propriétaire du serveur.", flags: MessageFlags.Ephemeral });
        }

        const authorHighest = interaction.member.roles?.highest?.position ?? 0;
        const targetHighest = targetMember.roles?.highest?.position ?? 0;
        const meHighest = me.roles?.highest?.position ?? 0;

        if (authorHighest <= targetHighest && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: "❌ Tu ne peux pas bannir un membre avec un rôle supérieur ou égal au tien.", flags: MessageFlags.Ephemeral });
        }

        if (meHighest <= targetHighest) {
            return interaction.reply({ content: "❌ Je ne peux pas bannir ce membre à cause de la hiérarchie des rôles.", flags: MessageFlags.Ephemeral });
        }

        if (!targetMember.bannable) {
            return interaction.reply({ content: "❌ Ce membre ne peut pas être banni.", flags: MessageFlags.Ephemeral });
        }

        try {
            await targetMember.ban({ reason });
            return interaction.reply({
                content: `🛡️ ${targetUser.tag} a été banni par ${interaction.user.tag} • Raison: ${reason}`,
            });
        } catch {
            return interaction.reply({ content: "❌ Une erreur est survenue lors du bannissement.", flags: MessageFlags.Ephemeral });
        }
    },
};
