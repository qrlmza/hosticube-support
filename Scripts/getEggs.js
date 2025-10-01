const axios = require('axios');
require('dotenv').config();
const color = require('colors/safe');
const pteroqUrl = process.env.PTEROQ_URL;
const pteroqKey = process.env.PTEROQ_KEY;

async function listAllEggs() {
    try {
        const nestsResponse = await axios.get(`${pteroqUrl}/api/application/nests`, {
            headers: {
                'Authorization': `Bearer ${pteroqKey}`,
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        });

        for (const nest of nestsResponse.data.data) {
            const nestId = nest.attributes.id;
            
            const eggsResponse = await axios.get(`${pteroqUrl}/api/application/nests/${nestId}/eggs?include=variables`, {
                headers: {
                    'Authorization': `Bearer ${pteroqKey}`,
                    'Accept': 'Application/vnd.pterodactyl.v1+json'
                }
            });

            console.log(color.cyan(`\n=== ${nest.attributes.name} (Nest ID: ${nestId}) ===`));
            
            for (const egg of eggsResponse.data.data) {
                console.log(color.green(`\n  📦 ${egg.attributes.name} (Egg ID: ${egg.attributes.id})`));
                
                if (egg.attributes.relationships?.variables?.data) {
                    console.log(color.yellow("     Variables obligatoires:"));
                    for (const variable of egg.attributes.relationships.variables.data) {
                        if (variable.attributes.rules.includes('required')) {
                            console.log(`       - ${variable.attributes.env_variable} (défaut: ${variable.attributes.default_value || 'aucun'})`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(color.red("Erreur:"), error.response?.data || error.message);
    }
}

// Exécuter
listAllEggs();