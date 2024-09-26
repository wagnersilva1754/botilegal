// Bot Wl

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Quando o bot estiver pronto
client.once('ready', () => {
    console.log(`Bot está online! Logado como ${client.user.tag}`);
});

// Função para enviar logs ao Discord
async function sendLogToDiscord(content) {
    const logChannel = client.channels.cache.get('1277357891975905352'); // ID do canal de log
    if (!logChannel) {
        console.error('Canal de log não encontrado');
        return;
    }

    const logEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(content)
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
}

// Interceptar mensagens
client.on('messageCreate', async message => {
    if (message.content === '.wl') {
        const embed = new EmbedBuilder()
            .setColor(0xe63946)
            .setTitle('✨ FACÇÃO X ✨')
            .setDescription('**FAÇA SEU REGISTRO AQUI**\n🔐 **Registre-se preenchendo SEUS DADOS CORRETAMENTE**\n')
            .setThumbnail('https://i.ibb.co/vjb3XG9/image.png')
            .setFooter({ text: 'Clique no botão abaixo para registrar-se.', iconURL: 'https://i.ibb.co/vjb3XG9/image.png' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('request_wl')
                    .setLabel('💼 Solicitar WL')
                    .setStyle(ButtonStyle.Success)
            );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

// Processar o botão "Solicitar WL"
client.on('interactionCreate', async interaction => {
    if (interaction.customId === 'request_wl') {
        const modal = new ModalBuilder()
            .setCustomId('wl_modal')
            .setTitle('📝 Formulário de WL');

        // Campos de texto
        const nameInput = new TextInputBuilder()
            .setCustomId('nameInput')
            .setLabel("✍️ Seu nome")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const idInput = new TextInputBuilder()
            .setCustomId('idInput')
            .setLabel("🆔 Seu ID no jogo")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const telInput = new TextInputBuilder()
            .setCustomId('telInput')
            .setLabel("📞 Seu Telefone no Jogo")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const indicadoPorInput = new TextInputBuilder()
            .setCustomId('indicadoPorInput')
            .setLabel("👤 Indicado Por")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const recrutadoPorInput = new TextInputBuilder()
            .setCustomId('recrutadoPorInput')
            .setLabel("🤝 Quem Recrutou")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Criar linha para cada campo
        const firstRow = new ActionRowBuilder().addComponents(nameInput);
        const secondRow = new ActionRowBuilder().addComponents(idInput);
        const thirdRow = new ActionRowBuilder().addComponents(telInput);
        const fourthRow = new ActionRowBuilder().addComponents(indicadoPorInput);
        const fifthRow = new ActionRowBuilder().addComponents(recrutadoPorInput);

        // Adicionar linhas ao modal
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

        // Enviar o modal
        await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'wl_modal') {
        const name = interaction.fields.getTextInputValue('nameInput');
        const gameId = interaction.fields.getTextInputValue('idInput');
        const tel = interaction.fields.getTextInputValue('telInput');
        const indicadoPor = interaction.fields.getTextInputValue('indicadoPorInput');
        const recrutadoPor = interaction.fields.getTextInputValue('recrutadoPorInput');

        const userId = interaction.user.id; // ID do Discord do usuário que solicitou

        // Enviar mensagem ao canal de análise de solicitação
        const logChannel = client.channels.cache.get('1277357891975905352');

        if (!logChannel) {
            console.error('Canal não encontrado');
            return await interaction.reply({ content: '❌ Canal de log não encontrado.', ephemeral: true });
        }

        // Embed da solicitação
        const reportEmbed = new EmbedBuilder()
            .setColor(0xe63946)
            .setTitle('🚨 Nova Solicitação de WL')
            .setDescription(`**Solicitante:** <@${userId}>\n**Nome:** ${name}\n**ID no jogo:** ${gameId}\n**Telefone no Jogo:** ${tel}\n**Indicado por:** ${indicadoPor}\n**Recrutado por:** ${recrutadoPor}\n**ID do Discord:** <@${userId}>`)
            .setFooter({ text: 'Aguardando aprovação', iconURL: 'https://i.ibb.co/vjb3XG9/image.png' })
            .setThumbnail('https://i.ibb.co/vjb3XG9/image.png');

        const message = await logChannel.send({ embeds: [reportEmbed] });

        // Botões de ação para aceitar ou recusar a solicitação
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_wl')
                    .setLabel('✅ Aceitar WL')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reject_wl')
                    .setLabel('❌ Recusar WL')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.edit({ components: [actionRow] });

        await interaction.reply({ content: '✅ Solicitação enviada para análise!', ephemeral: true });
    } else if (interaction.customId === 'accept_wl' || interaction.customId === 'reject_wl') {
        const isAccepting = interaction.customId === 'accept_wl';
        const message = interaction.message;

        // Pegar o ID do solicitante a partir da mensagem
        const reportContent = message.embeds[0].description;
        const userIdMatch = reportContent.match(/Solicitante: <@(\d+)>/);
        const mentionedUserIds = reportContent.match(/<@(\d+)>/g); // Todos os IDs mencionados na descrição

        const userId = userIdMatch ? userIdMatch[1] : null; // ID do usuário solicitante
        const firstMentionedUserId = mentionedUserIds && mentionedUserIds.length > 0 ? mentionedUserIds[0].replace(/<@|>/g, '') : null; // Primeiro ID mencionado

        if (firstMentionedUserId) {
            const member = await interaction.guild.members.fetch(firstMentionedUserId); // Pegar o membro a partir do primeiro ID mencionado

            if (isAccepting) {
                // Adicionar o cargo ao membro solicitante diretamente
                const role = interaction.guild.roles.cache.get('1277357299475939338'); // ID do cargo a ser atribuído
                if (role) {
                    await member.roles.add(role);
                    await interaction.reply({ content: `✅ WL aceita e cargo atribuído ao usuário ${member.user.tag}!`, ephemeral: true });
                } else {
                    console.error('Cargo não encontrado');
                    await interaction.reply({ content: '❌ Cargo não encontrado.', ephemeral: true });
                }
            } else {
                await interaction.reply({ content: '❌ WL Recusada!', ephemeral: true });
            }

            // Atualizar a mensagem original para remover os botões
            await message.edit({
                components: []
            });
        } else {
            await interaction.reply({ content: '❌ ID do solicitante não encontrado!', ephemeral: true });
        }
    }
});

// hierarquia 



client.login('MTI3NzM1NTgzNjA5NTU5ODYxNQ.Gho-6H.c8uHV_iSjFKhnzS5ICtfpR_k09erApOyY1c0yk');
