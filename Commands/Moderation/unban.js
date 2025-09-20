const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const color = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🛠️ Permet de retirer le bannissement d\'un membre du serveur.')
        .addUserOption(option => 
            option
                .setName("utilisateur")
                .setDescription("Utilisateur à unban :")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("raison")
                .setDescription("Pourquoi l\'utilisateur doit être unban ?")
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
            return interaction.reply({ content: "❌ Tu n'as pas spécifié d'utilisateur à uban.", flags: MessageFlags.Ephemeral });
        }

        if (!reason) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié de raison pour la commande.", flags: MessageFlags.Ephemeral });
        }

        try {
            await interaction.guild.members.unban(target.id, { reason }); // ✅ correction ici
            console.log(color.blue(`🛡️ L'utilisateur ${target.username} a été débanni par ${interaction.user.username} pour la raison suivante : ${reason}`));
            
            return interaction.reply({
                content: `🛡️ L'utilisateur ${target.username} a été débanni par ${interaction.user.username} pour la raison suivante : ${reason}`,
            });
        } catch (error) {
            console.error(color.red("⚠️ Une erreur est survenue lors de l'unban d'un utilisateur :"), error);
            return interaction.reply({ content: "❌ Une erreur est survenue lors du débannissement.", flags: MessageFlags.Ephemeral });
        }
    },
};
