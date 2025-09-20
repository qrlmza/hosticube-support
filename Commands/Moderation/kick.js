const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const color = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('🛠️ Permet d\'expulser un membre du serveur.')
        .addUserOption(option => 
            option
                .setName("utilisateur")
                .setDescription("Utilisateur à expulser :")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("raison")
                .setDescription("Pourquoi l\'utilisateur doit être explusé ?")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {

        const target = interaction.options.getUser('utilisateur');
        const reason = interaction.options.getString('raison');
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: "❌ Tu n'as pas la permission d'utiliser cette commande.", flags: MessageFlags.Ephemeral });
        }

        if (!target) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié d'utilisateur à expulser.", flags: MessageFlags.Ephemeral });
        }

        if (!reason) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié de raison pour la sanction.", flags: MessageFlags.Ephemeral });
        }

        try {
            await interaction.guild.members.kick(target.id, { reason }); // ✅ correction ici
            console.log(color.blue(`🛡️ L'utilisateur ${target.username} a été expulsé par ${interaction.user.username} pour la raison suivante : ${reason}`));
            
            return interaction.reply({
                content: `🛡️ L'utilisateur ${target.username} a été expulsé par ${interaction.user.username} pour la raison suivante : ${reason}`,
            });
        } catch (error) {
            console.error(color.red("⚠️ Une erreur est survenue lors de l'expulsion d'un utilisateur :"), error);
            return interaction.reply({ content: "❌ Une erreur est survenue lors de l'expulsion.", flags: MessageFlags.Ephemeral });
        }
    },
};
