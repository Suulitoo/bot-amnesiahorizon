const { 
Client, 
GatewayIntentBits, 
ChannelType, 
PermissionFlagsBits, 
ActionRowBuilder, 
ButtonBuilder, 
ButtonStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // commande pour envoyer le bouton ticket
    if (message.content === "!ticket") {

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('🎫 Créer un ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(button);

        await message.channel.send({
            content: "Clique sur le bouton pour ouvrir un ticket.",
            components: [row]
        });

    }
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    if (interaction.customId === "create_ticket") {

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ]
                }
            ]
        });

        await ticketChannel.send(`🎫 Ticket ouvert par ${interaction.user}`);

        await interaction.reply({
            content: `Ton ticket a été créé : ${ticketChannel}`,
            ephemeral: true
        });
    }

});

const token = process.env.DISCORD_TOKEN;

client.login(token);