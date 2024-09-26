const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

// IDs dos canais
const CHANNEL_TO_LISTEN = '1246158117855821906'; // Canal para escutar mensagens
const CHANNEL_TO_REPORT = '1246878113799999559'; // Canal para enviar relatórios
const GUILD_ID = '1246158117171892295'; // Substitua pelo seu ID de guilda

client.once('ready', () => {
    console.log(`Bot está online como ${client.user.tag}`);
});

// Função para analisar a mensagem e gerar relatório
client.on('messageCreate', async (message) => {
    if (message.channel.id === CHANNEL_TO_LISTEN) {
        const idMatch = message.content.match(/ID:\s*<@!?(\d+)>/);
        const factionMatch = message.content.match(/FACÇÃO:\s*<@&!?(\d+)>/);
        const setMatch = message.content.match(/SET:\s*<@&!?(\d+)>/);

        if (idMatch && factionMatch && setMatch) {
            const userId = idMatch[1]; // ID do usuário mencionado
            const factionId = factionMatch[1]; // ID da facção
            const setId = setMatch[1]; // ID do set

            console.log(`ID do usuário: ${userId}, FACÇÃO ID: ${factionId}, SET ID: ${setId}`); // Log para verificação

            const reportEmbed = new EmbedBuilder()
                .setColor(0xe63946)
                .setTitle('🚨 Novo Relatório')
                .setDescription(`**ID:** <@${userId}>\n**FACÇÃO:** <@&${factionId}>\n**SET:** <@&${setId}>`)
                .setTimestamp();

            // Obter cargos da guilda
            const guild = await client.guilds.fetch(GUILD_ID);
            const roles = guild.roles.cache.map(role => {
                return {
                    label: role.name,
                    value: role.id,
                };
            });

            // Criar um menu suspenso para seleção de cargo
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_role')
                .setPlaceholder('Selecione um cargo')
                .addOptions(roles);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const reportChannel = await client.channels.cache.get(CHANNEL_TO_REPORT);
            if (reportChannel) {
                const reportMessage = await reportChannel.send({ embeds: [reportEmbed], components: [row] });
                await message.react('✅'); // Mensagem reconhecida
            } else {
                console.error('Canal de relatório não encontrado');
                await message.react('❌'); // Mensagem não reconhecida
            }
        } else {
            console.error('Formato da mensagem inválido');
            await message.react('❌'); // Mensagem não reconhecida
        }
    }
});

// Interagir com o menu suspenso
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return; // Verifica se é um menu suspenso

    const selectedRoleId = interaction.values[0]; // ID do cargo selecionado
    const userIdMatch = interaction.message.embeds[0].description.match(/ID:\s*<@!?(\d+)>/);

    if (userIdMatch) {
        const userId = userIdMatch[1]; // ID do usuário que deve receber o cargo

        try {
            const guild = await client.guilds.fetch(GUILD_ID);
            const member = await guild.members.fetch(userId); // Buscar o membro
            const role = guild.roles.cache.get(selectedRoleId); // Buscar o cargo

            if (role) {
                await member.roles.add(role);
                console.log(`Cargo ${role.name} adicionado ao usuário: <@${userId}>`);

                // Criar um embed para registrar quem atribuiu o cargo
                const approvalEmbed = new EmbedBuilder()
                    .setColor(0x3cb371)
                    .setTitle('✅ Cargo Atribuído')
                    .setDescription(`**Cargo Atribuído:** <@&${selectedRoleId}>\n**Para:** <@${userId}>\n**Atribuído por:** <@${interaction.user.id}>`)
                    .setTimestamp();

                // Enviar o embed de aprovação no canal de relatórios
                await interaction.channel.send({ embeds: [approvalEmbed] });
            } else {
                console.error('Cargo não encontrado');
            }

            await interaction.reply({ content: `Cargo atribuído com sucesso!`, ephemeral: true }); // Resposta privada
        } catch (error) {
            console.error('Erro ao adicionar cargo:', error);
        }
    }
});

client.login('MTI3NzM1NTgzNjA5NTU5ODYxNQ.Gho-6H.c8uHV_iSjFKhnzS5ICtfpR_k09erApOyY1c0yk');
