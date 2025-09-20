// ./Handlers/ready.js

const { ActivityType, Events } = require('discord.js');
var color = require('colors/safe');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
        client.user.setActivity('👀 Besoin d\'aide ? Une question ? Ouvrez un ticket !', { type: ActivityType.Custom  });
		console.log(color.green(`Ready! Logged in as ${client.user.username}`));
	},
};
