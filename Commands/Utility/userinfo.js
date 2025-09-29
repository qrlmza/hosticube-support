const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Affiche les informations sur un membre ou sur vous.')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur dont vous voulez voir les informations')
                .setRequired(false)),
    
    async execute(interaction) {
        // Récupérer l'utilisateur ciblé ou l'utilisateur qui a utilisé la commande
        const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
        const targetMember = interaction.guild?.members.cache.get(targetUser.id);
        
        // Créer l'embed avec les informations de base
        const embed = new EmbedBuilder()
            .setColor('#9E3737')
            .setTitle(`📋 Informations sur ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '👤 Utilisateur',
                    value: `<@${targetUser.id}>`,
                    inline: true
                },
                {
                    name: '🆔 ID',
                    value: targetUser.id,
                    inline: true
                },
                {
                    name: '📅 Compte créé le',
                    value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                    inline: false
                }
            )
            .setFooter({
                text: `Demandé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Si l'utilisateur est sur le serveur, ajouter les informations du membre
        if (targetMember) {
            embed.addFields(
                {
                    name: '📥 A rejoint le serveur le',
                    value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`,
                    inline: false
                },
                {
                    name: '📛 Surnom',
                    value: targetMember.nickname || 'Aucun',
                    inline: true
                },
                {
                    name: '🎭 Rôles',
                    value: targetMember.roles.cache.size > 1 
                        ? targetMember.roles.cache
                            .filter(role => role.id !== interaction.guild.id)
                            .map(role => role.toString())
                            .slice(0, 10)
                            .join(', ') + (targetMember.roles.cache.size > 11 ? '...' : '')
                        : 'Aucun rôle',
                    inline: false
                },
                {
                    name: '🏆 Rôle le plus élevé',
                    value: targetMember.roles.highest.id !== interaction.guild.id 
                        ? targetMember.roles.highest.toString() 
                        : 'Aucun',
                    inline: true
                },
                {
                    name: '🎨 Couleur de rôle',
                    value: targetMember.displayHexColor || '#000000',
                    inline: true
                }
            );

            // Ajouter les permissions si c'est un administrateur
            if (targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
                embed.addFields({
                    name: '⚡ Permissions spéciales',
                    value: '🛡️ Administrateur',
                    inline: true
                });
            }

            // Statut de présence
            const presence = targetMember.presence;
            if (presence) {
                const statusEmojis = {
                    online: '🟢',
                    idle: '🟡',
                    dnd: '🔴',
                    offline: '⚫'
                };
                
                embed.addFields({
                    name: '📶 Statut',
                    value: `${statusEmojis[presence.status] || '⚫'} ${presence.status}`,
                    inline: true
                });
            }
        } else {
            embed.addFields({
                name: '⚠️ Statut du serveur',
                value: 'Cet utilisateur n\'est pas membre de ce serveur',
                inline: false
            });
        }

        // Badges utilisateur (Nitro, Early Supporter, etc.)
        const userFlags = targetUser.flags.toArray();
        const badges = [];
        // Mapping des flags Discord vers les noms d'emojis uploadés
        const flagEmojis = {
            Staff: '<a:moderator:1418890973433561108>',
            Partner: '<a:partner:1418890976960843868>',
            Hypesquad: '<a:bravery:1418890967368466553>',
            BugHunterLevel1: '<a:bugHunter1:1418891563978985634>',
            HypeSquadOnlineHouse1: '<a:bravery:1418890967368466553>', // Bravery
            HypeSquadOnlineHouse2: '<a:brilliance:1418890965900333137>', // Brilliance
            HypeSquadOnlineHouse3: '<a:balance:1418891673131552808>', // Balance
            PremiumEarlySupporter: '<a:earlySuporter:1418890960074444810>',
            BugHunterLevel2: '<a:bugHunter2:1418890980505157752>',
            VerifiedBot: '<:certifiedApp:1418890842286063616>',
            VerifiedDeveloper: '<a:developer:1418890971822686279>',
            CertifiedModerator: '<a:moderatorCertified:1418890955494264894>',
            BotHTTPInteractions: '<:quest:1418890970933624832>',
            ActiveDeveloper: '<a:activeDeveloper:1418890963966758982>',
            Nitro: '<a:nitro:1418890957692207155>',
            KnownHas: '<a:KnownHas:1418890962230575126>',
            App: '<:app:1418890817296269435>'
        };

        userFlags.forEach(flag => {
            if (flagEmojis[flag]) {
                badges.push(flagEmojis[flag]);
            }
        });

        if (badges.length > 0) {
            embed.addFields({
                name: '🏅 Badges',
                value: badges.join(' '),
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
}
