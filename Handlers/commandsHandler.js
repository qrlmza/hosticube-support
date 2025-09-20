const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
var color = require('colors/safe');

module.exports = async (client) => {
    client.commands = new Collection();
    const commands = []; // Array pour stocker les données des commandes à envoyer à Discord
    
    const commandsPath = path.join(__dirname, '..', 'Commands');
    
    // Vérifier si le dossier Commands existe
    if (!fs.existsSync(commandsPath)) {
        console.log(color.yellow('⚠️  Le dossier Commands n\'existe pas. Création...'));
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }
    
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        // Vérifier si c'est un dossier
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            
            // Vérifier que la commande a les propriétés requises
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON()); // Ajouter la commande à l'array pour Discord
                console.log(color.green(`✅ Commande chargée: ${command.data.name} (${folder})`));
            } else {
                console.log(color.red(`❌ Erreur: La commande ${file} n'a pas les propriétés 'data' et 'execute' requises.`));
            }
        }
    }
    
    console.log(color.cyan(`📦 Total: ${client.commands.size} commande(s) chargée(s)`));
    
    // Déployer les commandes sur Discord
    if (commands.length > 0) {
        try {
            console.log(color.yellow('🔄 Déploiement des commandes slash en cours...'));
            
            const rest = new REST({ version: '10' }).setToken(process.env.APP_TOKEN || client.token);
            
            // Pour déployer globalement (peut prendre jusqu'à 1 heure)
            // await rest.put(Routes.applicationCommands(client.user?.id || process.env.APP_ID), { body: commands });
            
            // Pour déployer sur un serveur spécifique (instantané) - recommandé pour le développement
            if (process.env.GUILD_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(client.user?.id || process.env.APP_ID, process.env.GUILD_ID),
                    { body: commands }
                );
                console.log(color.green(`✅ ${commands.length} commande(s) slash déployée(s) sur le serveur (${process.env.GUILD_ID})`));
            } else {
                // Déploiement global si aucun GUILD_ID n'est spécifié
                await rest.put(
                    Routes.applicationCommands(client.user?.id || process.env.APP_ID),
                    { body: commands }
                );
                console.log(color.green(`✅ ${commands.length} commande(s) slash déployée(s) globalement`));
            }
            
        } catch (error) {
            console.error(color.red('❌ Erreur lors du déploiement des commandes:'), error);
        }
    }
};