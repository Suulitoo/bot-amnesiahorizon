const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    console.log(`Message from ${message.author.tag}: ${message.content}`);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.log('DISCORD_TOKEN environment variable not set.');
} else {
    client.login(token);
}