const { Events } = require('discord.js');
var color = require('colors/safe');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Vérifier si c'est une commande slash
        if (!interaction.isChatInputCommand()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
            console.log(color.red(`❌ Aucune commande correspondant à ${interaction.commandName} n'a été trouvée.`));
            return;
        }
        
        try {
            await command.execute(interaction);
            console.log(color.blue(`🔧 Commande utilisée: ${interaction.commandName} par ${interaction.user.tag}`));
        } catch (error) {
            console.error(color.red(`❌ Erreur lors de l'exécution de ${interaction.commandName}:`), error);
            
            const errorMessage = {
                content: '❌ Une erreur est survenue lors de l\'exécution de cette commande !',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
};