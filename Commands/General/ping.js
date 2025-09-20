const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot.'),
    
    async execute(interaction) {
        const sent = await interaction.reply({
            content: '🏓 Pinging...',
            fetchReply: true
        });
        
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);
        
        await interaction.editReply({
            content: `🏓 **Pong!**\n📡 Latence: \`${ping}ms\`\n💓 API: \`${apiPing}ms\``
        });
    },
};