const { Client, GatewayIntentBits } = require('discord.js');

// Crée le client avec les intents nécessaires pour lire les messages
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Log tous les messages reçus (hors bots)
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    console.log(`Message from ${message.author.tag}: ${message.content}`);
});

// Connexion avec le token depuis la variable d'environnement
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.log('DISCORD_TOKEN environment variable not set.');
} else {
    client.login(token);
}