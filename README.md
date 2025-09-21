

# 🛡️ hosticube-support


🤖 Bot Discord de support pour la communauté Hosticube.  
Ce bot propose des commandes de modération, d’utilité et de gestion de tickets pour faciliter l’assistance et l’administration sur le serveur.

**💬 Besoin d’aide ou de support ? Rejoins le Discord : [hosticube-support](https://discord.gg/FCFa3XqUeK)**


## ✨ Fonctionnalités principales

- **Gestion des tickets** : création de salons privés pour le support.
- **Commandes de modération** : ban, kick, timeout, unban.
- **Commandes utilitaires** : ping, help, userinfo, status des services.
- **Affichage des rôles, badges et informations utilisateur.**
- **Vérification du statut des services (DNS, Panel, Cluster).**


## 🗂️ Structure du projet

```
hosticube-support/
│
├── Commands/
│   ├── General/         # Commandes générales (ping, help)
│   ├── Moderation/      # Commandes de modération (ban, kick, timeout, unban)
│   └── Utility/         # Commandes utilitaires (userinfo, ticket, status)
│
├── Handlers/            # Gestionnaires d’événements Discord
│
├── Scripts/             # Scripts utilitaires (getEmojis.js, getDate.js)
│
├── main.js              # Point d’entrée du bot
├── package.json         # Dépendances et configuration npm
├── .env.example         # Exemple de configuration des variables d’environnement
├── LICENSE              # Licence Apache 2.0
└── README.md            # Ce fichier
```


## ⚙️ Installation

1. Clone le dépôt :
	```sh
	git clone https://github.com/qrlmza/hosticube-support.git
	cd hosticube-support
	```

2. Installe les dépendances :
	```sh
	npm install
	```

3. Configure le fichier `.env` (voir `.env.example`) :
	```
	APP_TOKEN=ton_token_discord
	APP_ID=ton_id_bot
	GUILD_ID=id_de_ton_serveur (optionnel pour le déploiement rapide des commandes)
	```


## 🚀 Démarrage

```sh
node main.js
```

Le bot se connectera à Discord et chargera toutes les commandes et événements.


## 📦 Dépendances principales

- [discord.js](https://discord.js.org/) (gestion du bot Discord)
- [dotenv](https://www.npmjs.com/package/dotenv) (variables d’environnement)
- [colors](https://www.npmjs.com/package/colors) (affichage coloré en console)
- [axios](https://www.npmjs.com/package/axios) et [node-fetch](https://www.npmjs.com/package/node-fetch) (requêtes HTTP)
- [mysql2](https://www.npmjs.com/package/mysql2) (support base de données, si besoin)


## 📝 Commandes disponibles

- `/help` : Affiche la liste des commandes
- `/ping` : Affiche la latence du bot
- `/userinfo` : Affiche les infos d’un membre
- `/support` : Ouvre un ticket de support
- `/status` : Affiche le statut des services (DNS, Panel, Cluster)
- `/ban`, `/kick`, `/timeout`, `/unban` : Commandes de modération


## 📄 Licence

Ce projet est sous licence Apache 2.0.