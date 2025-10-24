// Handlers/AIPrivateMessage.js
// const fetch = require('node-fetch');
const color = require('colors/safe');

const MAMMOUTH_URL = 'https://api.mammouth.ai/v1/chat/completions';
const MODEL = 'gpt-4.1-nano';

// Petit anti-spam: 1 msg / user / 5s
const cooldown = new Map();
const COOLDOWN_MS = 5000;

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(message, client) {
        try {
            // 1) Ignore bots
            if (!message || message.author?.bot) return;

            // 2) Ne répondre qu'en DM (ignore les salons de serveur)
            // Deux façons correctes: !message.guild OU message.channel?.isDMBased()
            if (message.guild) return;

            // 3) Cooldown simple
            const now = Date.now();
            const last = cooldown.get(message.author.id) || 0;
            if (now - last < COOLDOWN_MS) return;
            cooldown.set(message.author.id, now);

            // 4) Contenu utilisateur
            const userMessage = message.content?.trim();
            if (!userMessage) return;

            // 5) Optionnel: indicateur de saisie
            await message.channel.sendTyping();

            // 6) Appel API Mammouth
            const apiKey = process.env.AI_API_KEY;
            if (!apiKey) {
                console.error(color.red('❌ AI_API_KEY manquant dans .env'));
                return message.channel.send("Configuration error: AI key is missing. Please contact support.");
            }

            const payload = {
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are Vanity, an AI developed by Hosticube to assist users with Pterodactyl-based Minecraft server administration, providing step-by-step, reliable guidance. Always reply in the user’s language; default to French (France).'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ]
            };

            const res = await fetch(MAMMOUTH_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                console.error(color.red(`❌ Mammouth API HTTP ${res.status}: ${text}`));
                return message.channel.send("Désolé, le service d’IA est momentanément indisponible. Réessaie plus tard.");
            }

            const data = await res.json();

            // 7) Extraction du message (format proche OpenAI)
            const aiReply =
                data?.choices?.[0]?.message?.content
                || data?.choices?.[0]?.text
                || "Désolé, je n’ai pas pu générer de réponse pour le moment.";

            // 8) Répondre en DM
            return message.channel.send(aiReply);

        } catch (err) {
            console.error(color.red(`❌ Erreur AIPrivateMessage: ${err?.message || err}`));
            try {
                await message.channel.send("Une erreur s’est produite. Merci de réessayer.");
            } catch (_) { }
        }
    }
};
