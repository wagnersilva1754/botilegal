const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const reportChannelId = '1277357891975905352'; // ID do canal para enviar relatórios
const replacementRoleId = '1288671389871767552'; // ID do cargo a ser aplicado após a remoção
const requiredRoleId = '1277357299475939338'; // ID do cargo necessário para usar o comando

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Verificar se o autor da mensagem tem o cargo necessário
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.has(requiredRoleId)) {
        message.reply('Você não tem permissão para usar este comando.');
        return;
    }

    if (message.content.trim() === '.demitir') {
        const filter = response => response.author.id === message.author.id;

        message.channel.send('Mencione o usuário que você deseja demitir. Você tem 1 minuto para isso.');

        try {
            const userCollected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const mention = userCollected.first().mentions.users.first(); // Pega a primeira menção

            if (!mention) {
                message.channel.send('Nenhuma menção detectada. Certifique-se de mencionar um usuário corretamente.');
                return;
            }

            const targetMember = message.guild.members.cache.get(mention.id);

            if (!targetMember) {
                message.channel.send('Usuário não encontrado. Certifique-se de que o ID está correto.');
                return;
            }

            // Listar cargos disponíveis
            const roles = targetMember.roles.cache.filter(role => role.id !== message.guild.id); // Evitar @everyone

            if (roles.size === 0) {
                message.channel.send('Esse usuário não possui cargos que podem ser removidos.');
                return;
            }

            // Criar um menu suspenso com os cargos disponíveis
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-roles')
                .setPlaceholder('Selecione até 3 cargos para remover')
                .setMinValues(1)
                .setMaxValues(Math.min(3, roles.size)); // Limitar até 3 cargos
              
            // Adicionar os cargos ao menu
            roles.forEach(role => {
                selectMenu.addOptions({
                    label: role.name,
                    value: role.id
                });
            });

            const row = new ActionRowBuilder().addComponents(selectMenu);
            message.channel.send({
                content: 'Selecione os cargos que você deseja remover:',
                components: [row]
            });

            // Coletar a interação com o menu suspenso
            const interactionFilter = (interaction) => interaction.customId === 'select-roles' && interaction.user.id === message.author.id;
            const interaction = await message.channel.awaitMessageComponent({ filter: interactionFilter, time: 60000 });

            const selectedRoleIds = interaction.values;

            // Remover os cargos selecionados
            for (const roleId of selectedRoleIds) {
                const roleToRemove = message.guild.roles.cache.get(roleId);
                if (roleToRemove) {
                    await targetMember.roles.remove(roleToRemove);
                }
            }

            // Adicionar o cargo específico após remover os cargos selecionados
            const replacementRole = message.guild.roles.cache.get(replacementRoleId);
            if (replacementRole) {
                await targetMember.roles.add(replacementRole);
                message.channel.send(`O cargo <@&${replacementRoleId}> foi aplicado a <@${mention.id}>.`);
            } else {
                console.error('O cargo de substituição não foi encontrado.');
            }

            // Criar e enviar o relatório de demissão
            const reportEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('📋 Relatório de Demissão')
                .addFields(
                    { name: 'Nome do Usuário', value: targetMember.user.tag, inline: true },
                    { name: 'ID do Usuário', value: targetMember.id, inline: true },
                    { name: 'Data da Demissão', value: new Date().toLocaleString(), inline: true },
                    { name: 'Quem Demitiu', value: message.author.tag, inline: true },
                    { name: 'Cargos Removidos', value: selectedRoleIds.map(roleId => `<@&${roleId}>`).join(', '), inline: true },
                    { name: 'Cargo Aplicado', value: `<@&${replacementRoleId}>`, inline: true }
                )
                .setFooter({ text: `Relatório gerado por ${message.author.tag}` });

            const reportChannel = client.channels.cache.get(reportChannelId);
            if (reportChannel) {
                await reportChannel.send({ embeds: [reportEmbed] });
            } else {
                console.error('Canal de relatório não encontrado.');
            }

            interaction.update({ content: `Os cargos foram removidos com sucesso de <@${mention.id}>! O cargo <@&${replacementRoleId}> foi aplicado.`, components: [] });

        } catch (err) {
            message.channel.send('Tempo esgotado ou houve um erro. Tente novamente.');
            console.error(err);
        }
    }
});

// Substitua pelo seu token
client.login(process.env.BOT_TOKEN);
