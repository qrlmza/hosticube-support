const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const color = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('🛠️ Permet d\'exclure temporairement un membre du serveur.')
        .addUserOption(option => 
            option
                .setName("utilisateur")
                .setDescription("Utilisateur à exclure :")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("raison")
                .setDescription("Pourquoi l\'utilisateur doit être exclus ?")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("durée")
                .setDescription("Combien de temps la personne doit être timeout ?")
                .addChoices(
                    { name: "1 minute", value: '60000' },                   // 1 min = 60 * 1000 ms
                    { name: "5 minutes", value: '300000' },                 // 5 min = 5 * 60 * 1000 ms
                    { name: "10 minutes", value: '600000' },                // 10 min = 10 * 60 * 1000 ms
                    { name: "1 heure", value: '3600000' },                  // 1 heure = 60 * 60 * 1000 ms
                    { name: "1 jour", value: '86400000' },                  // 1 jour = 24 * 60 * 60 * 1000 ms
                    { name: "1 semaine", value: '604800000' },              // 1 semaine = 7 * 24 * 60 * 60 * 1000 ms
                    { name: "28 jours", value: '2419200000' }               // 28 jours = 28 * 24 * 60 * 60 * 1000 ms
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {

        const target = interaction.options.getUser('utilisateur');
        const reason = interaction.options.getString('raison');
        const duration = interaction.options.getString('durée');
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: "❌ Tu n'as pas la permission d'utiliser cette commande.", flags: MessageFlags.Ephemeral });
        }

        if (!target) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié d'utilisateur à exclure.", flags: MessageFlags.Ephemeral });
        }

        if (!reason) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié de raison pour la sanction.", flags: MessageFlags.Ephemeral });
        }

        if (!duration) {
            return interaction.reply({ content: "❌ Tu n'as pas spécifié de durée pour le timeout.", flags: MessageFlags.Ephemeral });
        }

        try {
            const member = await interaction.guild.members.fetch(target.id);
            
            if (!member) {
                return interaction.reply({ content: "❌ Cet utilisateur n'est pas membre du serveur.", flags: MessageFlags.Ephemeral });
            }

            if (!member.moderatable) {
                return interaction.reply({ content: "❌ Je ne peux pas timeout cet utilisateur (rôle trop élevé).", flags: MessageFlags.Ephemeral });
            }

            await member.timeout(parseInt(duration), reason);
            
            const durationNames = {
                '60000': '1 minute',
                '300000': '5 minutes', 
                '600000': '10 minutes',
                '3600000': '1 heure',
                '86400000': '1 jour',
                '604800000': '1 semaine',
                '2419200000': '28 jours'
            };
            
            const durationName = durationNames[duration] || 'durée inconnue';
            
            console.log(color.blue(`🛡️ L'utilisateur ${target.username} a été timeout pendant ${durationName} par ${interaction.user.username} pour la raison suivante : ${reason}`));
            
            return interaction.reply({
                content: `🛡️ L'utilisateur ${target.username} a été timeout pendant ${durationName} par ${interaction.user.username} pour la raison suivante : ${reason}`,
            });
        } catch (error) {
            console.error(color.red("⚠️ Une erreur est survenue lors du timeout de l'utilisateur :"), error);
            return interaction.reply({ content: "❌ Une erreur est survenue lors du timeout.", flags: MessageFlags.Ephemeral });
        }
    },
};