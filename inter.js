const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const webhookChannelId = '1286715305116041256'; // O canal que recebe mensagens via webhook
const targetChannelId = '1288839727558033439'; // O canal onde as mensagens serão redirecionadas

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Verifica se a mensagem é do canal do webhook
    if (message.channel.id === webhookChannelId && !message.author.bot) {
        // Busca o canal de destino
        const targetChannel = client.channels.cache.get(targetChannelId);

        if (targetChannel) {
            try {
                // Envia a mensagem recebida no canal do webhook para o canal de destino
                await targetChannel.send({
                    content: message.content,
                    embeds: message.embeds // Se a mensagem tiver embeds, eles serão incluídos
                });
            } catch (err) {
                console.error('Erro ao redirecionar a mensagem:', err);
            }
        } else {
            console.error('Canal de destino não encontrado.');
        }
    }
});

// Substitua pelo seu token do bot
client.login(process.env.BOT_TOKEN);
