const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const color = require('colors/safe');
const pteroqUrl = process.env.PTEROQ_URL;
const pteroqKey = process.env.PTEROQ_KEY;

const offerSpecs = {
    mini: {
        memory: 2048,
        cpu: 200,
        disk: 5120,
        io: 500,
        backups: 1,
        databases: 0,
        allocations: 1
    },
    starter: {
        memory: 4096,
        cpu: 400,
        disk: 12288,
        io: 500,
        backups: 3,
        databases: 1,
        allocations: 2
    },
    nano: {
        memory: 8192,
        cpu: 800,
        disk: 20480,
        io: 500,
        backups: 8,
        databases: 2,
        allocations: 3
    },
    super: {
        memory: 16384,
        cpu: 800,
        disk: 32768,
        io: 500,
        backups: 12,
        databases: 3,
        allocations: 5
    }
};

// Configuration des eggs avec leurs variables obligatoires
const eggConfigs = {
    vanillacord: {
        id: 15,
        name: "VanillaCord",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
        environment: {
            SERVER_JARFILE: 'server.jar',
            VANILLA_VERSION: 'latest'
        }
    },
    forge: {
        id: 20,
        name: "Forge",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )',
        environment: {
            SERVER_JARFILE: 'server.jar',
            MC_VERSION: 'latest',
            BUILD_TYPE: 'recommended'
        }
    },
    spigot: {
        id: 16,
        name: "Spigot",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
        environment: {
            SERVER_JARFILE: 'server.jar',
            DL_VERSION: 'latest'
        }
    },
    purpur: {
        id: 17,
        name: "Purpur",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java --add-modules=jdk.incubator.vector -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
        environment: {
            MINECRAFT_VERSION: 'latest',
            SERVER_JARFILE: 'server.jar',
            BUILD_NUMBER: 'latest'
        }
    },
    paper: {
        id: 18,
        name: "Paper",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
        environment: {
            SERVER_JARFILE: 'server.jar',
            BUILD_NUMBER: 'latest'
        }
    },
    neoforge: {
        id: 19,
        name: "NeoForge",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true @unix_args.txt',
        environment: {
            MC_VERSION: 'latest'
        }
    },
    fabric: {
        id: 21,
        name: "Fabric",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
        environment: {
            SERVER_JARFILE: 'server.jar',
            MC_VERSION: 'latest',
            FABRIC_VERSION: 'latest',
            LOADER_VERSION: 'latest'
        }
    },
    pocketmine: {
        id: 24,
        name: "PocketMine",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: './start.sh',
        environment: {
            VERSION: 'PM5'
        }
    },
    purpur_geyser: {
        id: 23,
        name: "Purpur + Geyser",
        dockerImage: 'ghcr.io/pterodactyl/yolks:java_20',
        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true --add-modules=jdk.incubator.vector -jar {{SERVER_JARFILE}}',
        environment: {
            MINECRAFT_VERSION: 'latest',
            SERVER_JARFILE: 'server.jar',
            BUILD_NUMBER: 'latest'
        }
    },
    bedrock: {
        id: 25,
        name: "Bedrock",
        dockerImage: 'ghcr.io/parkervcp/yolks:debian',
        startup: './bedrock_server',
        environment: {
            BEDROCK_VERSION: 'latest',
            LD_LIBRARY_PATH: '.',
            SERVERNAME: 'Bedrock Dedicated Server',
            GAMEMODE: 'survival',
            DIFFICULTY: 'easy',
            CHEATS: 'false'
        }
    },
    bedrock_arm: {
        id: 26,
        name: "Bedrock ARM64",
        dockerImage: 'ghcr.io/parkervcp/yolks:box64',
        startup: 'box64 ./bedrock_server',
        environment: {
            BEDROCK_VERSION: 'latest',
            LD_LIBRARY_PATH: '.',
            SERVERNAME: 'Bedrock Dedicated Server',
            GAMEMODE: 'survival',
            DIFFICULTY: 'easy',
            CHEATS: 'false'
        }
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-server')
        .setDescription('[TECH] Permet à un technicien / admin de créer un serveur sur le panel.')
        .addStringOption(option =>
            option
                .setName("email")
                .setDescription("Entrez l'email de l'utilisateur: ")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("offre")
                .setDescription("Choisissez l'offre souhaitée par le client: ")
                .setRequired(true)
                .addChoices(
                    { name: "Mini (0€ / mois)", value: "mini" },
                    { name: "Starter (1.50€ / mois)", value: "starter" },
                    { name: "Nano (3.90€ / mois)", value: "nano" },
                    { name: "Super (5.99€ / mois)", value: "super" }
                )
        )
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Type de serveur Minecraft")
                .setRequired(true)
                .addChoices(
                    { name: "🟢 VanillaCord", value: "vanillacord" },
                    { name: "🔥 Forge", value: "forge" },
                    { name: "🔌 Spigot", value: "spigot" },
                    { name: "💜 Purpur", value: "purpur" },
                    { name: "📄 Paper", value: "paper" },
                    { name: "⚡ NeoForge", value: "neoforge" },
                    { name: "🧵 Fabric", value: "fabric" },
                    { name: "📱 PocketMine", value: "pocketmine" },
                    { name: "🌉 Purpur + Geyser", value: "purpur_geyser" },
                    { name: "🟫 Bedrock", value: "bedrock" },
                    { name: "🟫 Bedrock ARM64", value: "bedrock_arm" }
                )
        )
        .addStringOption(option =>
            option
                .setName("version")
                .setDescription("Version de Minecraft (laisser vide pour 'latest')")
                .setRequired(false)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const email = interaction.options.getString("email");
        const offre = interaction.options.getString("offre");
        const type = interaction.options.getString("type");
        const version = interaction.options.getString("version") || 'latest';

        try {
            // Récupération de l'utilisateur
            const userInfos = await axios.get(`${pteroqUrl}/api/application/users?filter[email]=${email}`, {
                headers: {
                    'Authorization': `Bearer ${pteroqKey}`,
                    'Accept': 'Application/vnd.pterodactyl.v1+json',
                    'Content-Type': 'application/json'
                }
            });

            if (userInfos.data.data.length === 0) {
                return interaction.editReply("❌ Aucun utilisateur trouvé avec cet email.");
            }

            const userId = userInfos.data.data[0].attributes.id;
            const specs = offerSpecs[offre];
            const eggConfig = eggConfigs[type];

            // Mise à jour de la version si spécifiée
            const environment = { ...eggConfig.environment };
            if (version !== 'latest') {
                // Adapter selon le type d'egg
                if (environment.VANILLA_VERSION) environment.VANILLA_VERSION = version;
                if (environment.MC_VERSION) environment.MC_VERSION = version;
                if (environment.MINECRAFT_VERSION) environment.MINECRAFT_VERSION = version;
                if (environment.DL_VERSION) environment.DL_VERSION = version;
                if (environment.BEDROCK_VERSION) environment.BEDROCK_VERSION = version;
            }

            // Création du serveur
            const serverData = {
                name: `😊 Merci HostiCube pour le serveur Minecraft!`,
                user: userId,
                egg: eggConfig.id,
                docker_image: eggConfig.dockerImage,
                startup: eggConfig.startup,
                environment: environment,
                limits: {
                    memory: specs.memory,
                    swap: 0,
                    disk: specs.disk,
                    io: specs.io,
                    cpu: specs.cpu
                },
                feature_limits: {
                    databases: specs.databases,
                    allocations: specs.allocations,
                    backups: specs.backups
                },
                deploy: {
                    locations: [1],
                    dedicated_ip: false,
                    port_range: ["25560-25659"]
                }
            };

            const response = await axios.post(`${pteroqUrl}/api/application/servers`, serverData, {
                headers: {
                    'Authorization': `Bearer ${pteroqKey}`,
                    'Accept': 'Application/vnd.pterodactyl.v1+json',
                    'Content-Type': 'application/json'
                }
            });

            const serverId = response.data.attributes.identifier;
            console.log(color.green(`✅ Serveur créé avec succès - ID: ${serverId}`));
            
            await interaction.editReply(
                `✅ **Serveur créé avec succès !**\n\n` +
                `👤 Utilisateur: ${email}\n` +
                `📦 Type: ${eggConfig.name}\n` +
                `💎 Offre: **${offre}**\n` +
                `📊 Specs: ${specs.memory}MB RAM, ${specs.cpu/100} vCores, ${specs.disk}MB SSD\n` +
                `🆔 ID: \`${serverId}\`\n` +
                `🌐 Lien: ${pteroqUrl}/server/${serverId}`
            );
            
        } catch (error) {
            console.log(color.red("❌ Une erreur est survenue lors de la création du serveur: "));
            console.error(error.response?.data || error.message);
            
            await interaction.editReply("❌ Une erreur est survenue lors de la création du serveur ! Veuillez consulter les logs du bot.");
        }
    },
};