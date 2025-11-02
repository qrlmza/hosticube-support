const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const { getPool } = require('../../db');
const color = require('colors/safe');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription('Liste la blacklist et permet de retirer des utilisateurs.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // plus d’ephemeral ici
        await interaction.deferReply();

        const pool = getPool('s7_hosticube');
        const [rows] = await pool.execute('SELECT email, userId, `date`, authorId FROM blacklist ORDER BY `date` DESC');

        if (!rows.length) {
            return interaction.editReply({ content: '✅ Aucune entrée dans la blacklist.' });
        }

        const pageSize = 25;
        const pages = [];
        for (let i = 0; i < rows.length; i += pageSize) pages.push(rows.slice(i, i + pageSize));

        const resolveLabels = async (list) => {
            const out = [];
            for (const r of list) {
                let label = r.userId;
                try {
                    const u = await interaction.client.users.fetch(r.userId);
                    label = u?.tag || u?.username || r.userId;
                } catch { }
                out.push({
                    label: label.length > 100 ? label.slice(0, 97) + '…' : label,
                    value: r.userId,
                    description: (r.email ? r.email : 'Email introuvable') + ` • ${r.date || 'date ?'}`,
                });
            }
            return out;
        };

        const state = {
            page: 0,
            total: rows.length,
            nonce: `${interaction.id}:${Date.now()}`,
        };

        const buildEmbed = (p) =>
            new EmbedBuilder()
                .setTitle('Unblacklist')
                .setDescription('Sélectionne un ou plusieurs utilisateurs à retirer de la blacklist.')
                .addFields(
                    { name: 'Total en base', value: String(state.total), inline: true },
                    { name: 'Page', value: `${p + 1}/${pages.length}`, inline: true }
                )
                .setColor(0xfee75c);

        const buildMenu = async (p) => {
            const options = await resolveLabels(pages[p]);
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`unbl_select:${state.nonce}:${p}`)
                    .setPlaceholder('Choisis des utilisateurs à unblacklist')
                    .setMinValues(1)
                    .setMaxValues(Math.min(options.length, 25))
                    .addOptions(options)
            );
        };

        const buildNav = (p) =>
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`unbl_prev:${state.nonce}`)
                    .setLabel('Précédent')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(p === 0),
                new ButtonBuilder()
                    .setCustomId(`unbl_next:${state.nonce}`)
                    .setLabel('Suivant')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(p === pages.length - 1),
                new ButtonBuilder()
                    .setCustomId(`unbl_refresh:${state.nonce}`)
                    .setLabel('Rafraîchir')
                    .setStyle(ButtonStyle.Primary)
            );

        const msg = await interaction.editReply({
            embeds: [buildEmbed(state.page)],
            components: [await buildMenu(state.page), buildNav(state.page)],
        });

        // IMPORTANT: ne pas utiliser ComponentType.ActionRow (invalide)
        const filter = (i) => i.message.id === msg.id && i.customId.includes(state.nonce);
        const collector = msg.createMessageComponentCollector({
            // pas de componentType => accepte menus et boutons
            filter,
            time: 5 * 60 * 1000,
        });

        collector.on('collect', async (comp) => {
            // verrou pour l’auteur
            if (comp.user.id !== interaction.user.id) {
                return comp.reply({ content: '❌ Seul l’exécuteur de la commande peut utiliser ce menu.', ephemeral: true }).catch(() => { });
            }

            // SELECT MENU: suppression en BDD
            if (comp.isStringSelectMenu() && comp.customId.startsWith('unbl_select:')) {
                const ids = comp.values;
                try {
                    const placeholders = ids.map(() => '?').join(',');
                    await pool.execute(`DELETE FROM blacklist WHERE userId IN (${placeholders})`, ids);
                    state.total = Math.max(0, state.total - ids.length);

                    // Optionnel: tenter unban
                    try {
                        const guild = interaction.guild;
                        if (guild) {
                            for (const id of ids) {
                                try { await guild.bans.remove(id).catch(() => { }); } catch { }
                            }
                        }
                    } catch { }

                    // Recharger la liste
                    const [newRows] = await pool.execute('SELECT email, userId, `date`, authorId FROM blacklist ORDER BY `date` DESC');
                    if (!newRows.length) {
                        collector.stop('empty');
                        return comp.update({
                            content: `✅ Retiré de la blacklist: ${ids.join(', ')}\nLa blacklist est maintenant vide.`,
                            embeds: [],
                            components: [],
                        });
                    }

                    pages.length = 0;
                    for (let i = 0; i < newRows.length; i += pageSize) pages.push(newRows.slice(i, i + pageSize));
                    if (state.page > pages.length - 1) state.page = pages.length - 1;

                    await comp.update({
                        content: `✅ Retiré de la blacklist: ${ids.join(', ')}`,
                        embeds: [buildEmbed(state.page)],
                        components: [await buildMenu(state.page), buildNav(state.page)],
                    });
                } catch (e) {
                    console.log(color.red(`❎ Erreur suppression unblacklist: ${e}`));
                    // on répond pour éviter l'échec d’interaction
                    return comp.reply({ content: '❌ Erreur lors de la suppression en base.' }).catch(() => { });
                }
                return;
            }

            // BOUTONS: navigation / refresh
            if (comp.isButton()) {
                try {
                    if (comp.customId.startsWith('unbl_prev:')) {
                        state.page = Math.max(0, state.page - 1);
                    } else if (comp.customId.startsWith('unbl_next:')) {
                        state.page = Math.min(pages.length - 1, state.page + 1);
                    } else if (comp.customId.startsWith('unbl_refresh:')) {
                        const [fresh] = await pool.execute('SELECT email, userId, `date`, authorId FROM blacklist ORDER BY `date` DESC');
                        pages.length = 0;
                        for (let i = 0; i < fresh.length; i += pageSize) pages.push(fresh.slice(i, i + pageSize));
                        state.total = fresh.length;
                        if (!pages.length) {
                            collector.stop('empty');
                            return comp.update({ content: '✅ Plus aucune entrée.', embeds: [], components: [] });
                        }
                        if (state.page > pages.length - 1) state.page = pages.length - 1;
                    }

                    await comp.update({
                        embeds: [buildEmbed(state.page)],
                        components: [await buildMenu(state.page), buildNav(state.page)],
                    });
                } catch (e) {
                    console.log(color.red(`❎ Erreur navigation unblacklist: ${e}`));
                    // sécuriser la réponse
                    return comp.reply({ content: '❌ Erreur lors de la mise à jour de l’interface.' }).catch(() => { });
                }
            }
        });

        collector.on('end', async () => {
            try {
                await msg.edit({ components: [] });
            } catch { }
        });
    },
};
