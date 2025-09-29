const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const db = require('../../db');
const color = require('colors/safe');
const pteroqUrl = process.env.PTEROQ_URL;
const pteroqKey = process.env.PTEROQ_KEY;


function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
}

function validatePassword(password) {
    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{10,}$/;
    return regex.test(password);
    /**
     *  > Minimum 10 caractères
     *  > Au moins une majuscule
     *  > Au moins un chiffre
     *  > Au moins un caractère spécial : (?=.* ?[#?!@$%^&*-])
     */
}

function validatePhone(phoneNumber) {
    const regex = /^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:[\s.-]?\d{2}){4}$/;
    return regex.test(phoneNumber);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Permet de créer votre compte client.')
        .addStringOption(option =>
            option
                .setName("email")
                .setDescription("Entrez votre adresse eamil: ")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("prenom")
                .setDescription("Entrez votre prénom: ")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("nom")
                .setDescription("Entrez votre nom de famille: ")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("pseudo")
                .setDescription("Entrez votre nom d'utilisateur: ")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("password")
                .setDescription("Entrez votre mot passe: (10 caractères, caractères spéciaux, majuscules)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("telephone")
                .setDescription("Entrez votre numéro de téléphone: (06, 07, 09)")
                .setRequired(true)
        ),
    
    async execute(interaction) {
        
        const userId = interaction.user.id;
        const email = interaction.options.getString("email");
        const firstName = interaction.options.getString("prenom");
        const lastName = interaction.options.getString("nom");
        const username = interaction.options.getString("pseudo");
        const password = interaction.options.getString("password");
        const phoneNumber = interaction.options.getString("telephone");

        const errors = [];
        
        if(!validateEmail(email)) {
            errors.push("❌ L'adresse email fournie n'est pas valide.");
        }

        if(!validatePassword(password)) {
            errors.push("❌ Le mot de passe fourni ne correspond pas aux exigences:\n> 10 Caractères minimum.\n> Au moins une majuscule.\n> Au moins un chiffre.\n> Au moins un caractère spécial.");
        }

        if(!validatePhone(phoneNumber)) {
            errors.push("❌ Le numéro de téléphone entré n'est pas valide!");
        }

        if(errors.length > 0) {
            await interaction.reply({
                content: errors.join("\n\n"),
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        try {
            const userData = {
                email: email,
                username: username,
                first_name: firstName,
                last_name: lastName,
                password: password,
                language: 'en',
                root_admin: false
            };

            const response = await axios.post(`${pteroqUrl}/api/application/users`, userData, {
                headers: {
                    'Authorization': `Bearer ${pteroqKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const [result] = await db.query(
                'UPDATE users SET discord_id = ?, phone_number = ? WHERE email = ?',
                [userId, phoneNumber, email]
            );

            if (result.affectedRows === 0) {
                throw new Error('Aucun utilisateur trouvé avec cet email dans la base de données');
            }

            await interaction.reply({ content: "📢 Votre inscription est terminée ! Vous pouvez désormais vous connecter sur notre panel : https://pteroq.whst.fr/", flags: MessageFlags.Ephemeral });

        } catch (error) {
            let errorMessage = "❌ Une erreur est survenue lors de l'enregistrement de votre compte.";
            
            if (error.response && error.response.status === 422) {
                errorMessage = "❌ Cette adresse email ou ce nom d'utilisateur est déjà utilisé sur le panel.";
            } else if (error.message === 'Aucun utilisateur trouvé avec cet email dans la base de données') {
                errorMessage = "❌ Une erreur est survenue lors de la liaison avec votre compte Discord. Veuillez contacter un administrateur.";
            }
            
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
            console.log(color.red("❌ Une erreur est survenue lors de l'inscription de l'utilisateur: " + error));
        }
    },
};