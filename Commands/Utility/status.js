const { SlashCommandBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Affiche les status de nos services.')
        .addStringOption(option =>
            option
                .setName('service')
                .setDescription("Quel service est visé ?")
                .addChoices(
                    { name: 'DNS', value: 'dns' },
                    { name: 'Panel', value: 'panel' },
                    { name: 'Cluster N1A', value: 'n1a' },
                )
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const service = interaction.options.getString('service');

        if (service === 'dns') {
            const dnsServers = [
                { name: 'Alan', ip: '1.1.1.1' },
                { name: 'Irma', ip: '1.0.0.1' }
            ];

            const dnsPromises = dnsServers.map(async server => {
                try {
                    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=example.com&type=A`, {
                        method: 'GET',
                        headers: {
                            'accept': 'application/dns-json',
                            'host': server.ip
                        }
                    });
                    if (res.ok) {
                        return `✅ ${server.name} (${server.ip}) est opérationnel.`;
                    } else {
                        return `❌ ${server.name} (${server.ip}) ne répond pas.`;
                    }
                } catch (error) {
                    return `❌ ${server.name} (${server.ip}) erreur: ${error.message}`;
                }
            });

            const results = await Promise.all(dnsPromises);
            await interaction.reply(results.join('\n'));
            return;
        }

        if (service === 'panel') {
            try {
                const res = await fetch('https://pteroq.whst.fr');
                if (res.ok) {
                    await interaction.reply('✅ Panel Pterodactyl (pteroq.whst.fr) est opérationnel.');
                } else {
                    await interaction.reply('❌ Panel Pterodactyl (pteroq.whst.fr) ne répond pas.');
                }
            } catch (error) {
                await interaction.reply(`❌ Panel Pterodactyl (pteroq.whst.fr) erreur: ${error.message}`);
            }
            return;
        }

        if (service === 'n1a') {
            try {
                const res = await fetch('http://82.65.92.225');
                if (res.ok) {
                    await interaction.reply('✅ Cluster N1A est opérationnel.');
                } else {
                    await interaction.reply('❌ Cluster N1A ne répond pas aux ping.');
                }
            } catch (error) {
                await interaction.reply(`❌ Cluster N1A erreur: ${error.message}`);
            }
            return;
        }
    },
};