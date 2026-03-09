// index.js
require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Events,
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TICKET_CHANNEL_NAME = "tickets";
const BUTTON_CREATE_ID = "create_ticket";
const BUTTON_CLOSE_ID = "close_ticket";

client.once(Events.ClientReady, async () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    const guild = client.guilds.cache.first();
    if (!guild) {
        console.log("Aucun serveur trouvé. Invite le bot d'abord.");
        return;
    }

    const channel = guild.channels.cache.find(
        ch => ch.name === TICKET_CHANNEL_NAME && ch.type === ChannelType.GuildText
    );

    if (!channel) {
        console.log(`Salon #${TICKET_CHANNEL_NAME} introuvable. Crée-le d'abord.`);
        return;
    }

    // Vérifier si le message avec bouton existe déjà (évite les doublons)
    const messages = await channel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(m =>
        m.author.id === client.user.id &&
        m.components?.length > 0 &&
        m.components[0].components.some(c => c.customId === BUTTON_CREATE_ID)
    );

    if (existingMessage) {
        console.log("Le panneau de tickets existe déjà → pas de repost.");
        return;
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(BUTTON_CREATE_ID)
            .setLabel("Créer un ticket")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("✉️")
    );

    await channel.send({
        content: "**Support • Tickets**\nClique sur le bouton ci-dessous pour ouvrir un ticket privé.",
        components: [row]
    });

    console.log("Panneau de création de ticket envoyé avec succès !");
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const { guild, member, customId } = interaction;

    // ─── Création de ticket ───
    if (customId === BUTTON_CREATE_ID) {
        await interaction.deferReply({ ephemeral: true });

        const ticketName = `ticket-${member.user.username.toLowerCase()}-${Date.now().toString().slice(-4)}`;

        try {
            const ticketChannel = await guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: null, // ← change en ID de catégorie si tu veux
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: member.id, // l'utilisateur qui ouvre
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.AttachFiles,
                            PermissionsBitField.Flags.EmbedLinks
                        ]
                    },
                    {
                        id: client.user.id, // le bot
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }
                    // Ajoute ton rôle staff ici si besoin :
                    // { id: "123456789012345678", allow: [PermissionsBitField.Flags.ViewChannel, ...] }
                ],
                reason: `Ticket créé par ${member.user.tag}`
            });

            // Bouton de fermeture
            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(BUTTON_CLOSE_ID)
                    .setLabel("Fermer le ticket")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("🔒")
            );

            const welcomeEmbed = new EmbedBuilder()
                .setColor("#2f3136")
                .setTitle("Ticket ouvert")
                .setDescription(
                    `${member}, bienvenue dans ton ticket privé !\n` +
                    `Explique ton problème ci-dessous.\n\n` +
                    `Pour fermer ce ticket, utilise le bouton ci-dessous.`
                )
                .setTimestamp()
                .setFooter({ text: "Support - Ne partage pas d'informations sensibles publiquement" });

            await ticketChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed],
                components: [closeRow]
            });

            await interaction.editReply({
                content: `Ton ticket a été créé : ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Erreur lors de la création du ticket :", error);
            await interaction.editReply({
                content: "Erreur : impossible de créer le ticket (vérifie les permissions du bot).",
                ephemeral: true
            });
        }
    }

    // ─── Fermeture de ticket ───
    if (customId === BUTTON_CLOSE_ID) {
        if (!interaction.channel.name.startsWith("ticket-")) {
            return interaction.reply({
                content: "Ce bouton ne fonctionne que dans un ticket.",
                ephemeral: true
            });
        }

        await interaction.reply("Ticket en cours de fermeture...");

        try {
            // Suppression directe (solution la plus simple)
            await interaction.channel.delete("Ticket fermé par l'utilisateur");

            // Alternative : archive (décommente si tu préfères)
            // await interaction.channel.setName(`closed-${interaction.channel.name}`);
            // await interaction.channel.permissionOverwrites.edit(guild.id, { ViewChannel: false });
            // await interaction.channel.send("Ticket archivé.");
        } catch (error) {
            console.error("Erreur lors de la fermeture :", error);
            await interaction.followUp({
                content: "Erreur lors de la fermeture (vérifie les permissions du bot).",
                ephemeral: false
            });
        }
    }
});

// Connexion
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("DISCORD_TOKEN manquant dans les variables d'environnement !");
    process.exit(1);
}

client.login(token).catch(err => {
    console.error("Erreur lors de la connexion :", err);
    process.exit(1);
});
