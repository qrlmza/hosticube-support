// Commands/General/help.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    MessageFlags,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("Affiche l'aide des commandes.")
        .addStringOption(opt =>
            opt.setName('commande')
                .setDescription('Nom de la commande pour obtenir une aide détaillée')
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        const cmds = [...interaction.client.commands.values()].map(c => c.data?.name).filter(Boolean);
        const filtered = cmds.filter(n => n.toLowerCase().includes(focused.toLowerCase())).slice(0, 25);
        await interaction.respond(filtered.map(n => ({ name: n, value: n })));
    },

    async execute(interaction) {
        const { client } = interaction;
        const query = interaction.options.getString('commande', false);

        if (!client.commands?.size) {
            return interaction.reply({ content: 'Aucune commande trouvée.', flags: MessageFlags.Ephemeral });
        }

        if (query) {
            const cmd = client.commands.get(query) || [...client.commands.values()].find(c => c.data?.name === query);
            if (!cmd) {
                return interaction.reply({ content: `Commande introuvable: ${query}`, flags: MessageFlags.Ephemeral });
            }

            const name = cmd.data?.name ?? 'Inconnu';
            const description = cmd.data?.description ?? '—';
            const category = cmd.category ?? 'Divers';
            const usage = cmd.usage ?? `/${name}`;
            const perms = resolveCommandPermissions(cmd);

            const embed = new EmbedBuilder()
                .setTitle(`Aide — /${name}`)
                .setDescription(description)
                .addFields(
                    { name: 'Catégorie', value: category, inline: true },
                    { name: 'Utilisation', value: usage, inline: true },
                    { name: 'Permissions requises', value: perms.length ? perms.map(p => `\`${p}\``).join(', ') : 'Aucune', inline: false }
                )
                .setColor(0x2b2d31);

            return interaction.reply({ embeds: [embed] });
        }

        const grouped = groupByCategory(client.commands);
        const categories = Object.keys(grouped);
        const options = categories.map(cat => ({
            label: cat,
            value: cat,
            description: `${grouped[cat].length} commande(s)`,
            emoji: pickEmojiForCategory(cat),
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('help-category')
            .setPlaceholder('Choisis une catégorie')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        const embed = new EmbedBuilder()
            .setTitle('Aide — Commandes')
            .setDescription('Sélectionne une catégorie ci-dessous.')
            .setColor(0x2b2d31);

        const reply = await interaction.reply({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({ time: 60_000 });
        collector.on('collect', async i => {
            if (i.customId !== 'help-category') return;
            const cat = i.values[0];
            const list = grouped[cat] || [];
            const desc = list
                .map(c => {
                    const perms = resolveCommandPermissions(c);
                    const permTxt = perms.length ? ` · ${perms.join('+')}` : '';
                    return `• /${c.data.name} — ${c.data.description ?? '—'}${permTxt ? ` (${permTxt})` : ''}`;
                })
                .join('\n')
                .slice(0, 4000);

            const catEmbed = new EmbedBuilder()
                .setTitle(`${pickEmojiForCategory(cat)} ${cat}`)
                .setDescription(desc || 'Aucune commande.')
                .setColor(0x2b2d31);

            await i.update({ embeds: [catEmbed], components: [row] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(StringSelectMenuBuilder.from(select).setDisabled(true));
            await reply.edit({ components: [disabledRow] }).catch(() => { });
        });
    },
};

function resolveCommandPermissions(cmd) {
    const namesFromArray = Array.isArray(cmd.requiredPermissions) ? cmd.requiredPermissions.map(String) : [];
    const json = safeToJSON(cmd.data);
    const bitString = json?.default_member_permissions || null;
    const namesFromBits = bitString ? bitfieldToNames(BigInt(bitString)) : [];
    const merged = [...new Set([...namesFromArray, ...namesFromBits])];
    return merged;
}

function safeToJSON(data) {
    try { return typeof data?.toJSON === 'function' ? data.toJSON() : null; } catch { return null; }
}

function bitfieldToNames(bits) {
    const entries = Object.entries(PermissionFlagsBits);
    const names = [];
    for (const [name, value] of entries) {
        const v = BigInt(value);
        if ((bits & v) === v) names.push(name);
    }
    return names.sort();
}

function groupByCategory(commandsMap) {
    const out = {};
    for (const cmd of commandsMap.values()) {
        if (!cmd?.data?.name) continue;
        const cat = sanitizeCategory(cmd.category ?? inferCategoryFromPath(cmd.filePath) ?? 'Divers');
        if (!out[cat]) out[cat] = [];
        out[cat].push(cmd);
    }
    for (const k of Object.keys(out)) out[k].sort((a, b) => a.data.name.localeCompare(b.data.name));
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function inferCategoryFromPath(p) {
    if (!p) return null;
    const lower = String(p).toLowerCase();
    if (lower.includes('/moderation/')) return 'Moderation';
    if (lower.includes('/utility/')) return 'Utility';
    if (lower.includes('/general/')) return 'General';
    return null;
}

function sanitizeCategory(cat) {
    return String(cat).trim() || 'Divers';
}

function pickEmojiForCategory(cat) {
    const k = cat.toLowerCase();
    if (k.includes('mod')) return '🛡️';
    if (k.includes('util')) return '🧰';
    if (k.includes('gen')) return '📋';
    return '📁';
}
