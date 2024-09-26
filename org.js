const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config(); // Carregar variáveis do .env

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const reportChannelId = '1246878113799999559'; // ID do canal para enviar relatórios
const allowedUserId = '1124712542665715832'; // ID do usuário permitido para enviar informações

// Defina a data a partir da qual você deseja começar a contar
const startDate = new Date('2024-09-25'); // Substitua pela data desejada

const segments = {
    "Lavagem": { "BAHAMAS": 0, "TOMORROWLAND": 0, "LUXURY": 0, "CASABLANCA": 0, "ELDORADO": 0, "PARADISE": 0, "INFINITY": 0, "ABSOLUT": 0 },
    "Desmanche": { "MC": 0, "FURIOUS": 0, "SUBLIME": 0, "BENNYS": 0, "STREETRACE": 0, "LSCUSTOMS": 0, "UNDERGROUND": 0, "CAMORRA": 0, "DRIFTKING": 0 },
    "Armas": { "CDI": 0, "UMBRELLA": 0, "YAKUZA": 0, "MAFIA": 0, "MERCENARIOS": 0, "GROTTA": 0, "CORLEONE": 0, "ANONYMOUS": 0, "HELIPA": 0, "CV": 0, "BLOODS": 0 },
    "Munição": { "DRAGONS": 0, "MEDELLIN": 0, "MILICIA": 0, "BRATVA": 0, "VIDIGAL": 0, "ABUTRES": 0, "PCC": 0, "OKAIDA": 0, "OMEGA": 0, "CARTEL": 0, "TRIADE": 0, "SINALOA": 0, "FAMILIES": 0 }
};

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

// Função para enviar relatórios
const sendReport = async (channel) => {
    const embeds = [];
    const segmentColors = {
        "Lavagem": '#ffcc00',
        "Desmanche": '#ff3300',
        "Armas": '#00ccff',
        "Munição": '#33cc33'
    };

    const imageUrl = "https://i.ibb.co/NLDsK3h/image.png";

    for (const [segment, faccoes] of Object.entries(segments)) {
        const embed = new EmbedBuilder()
            .setColor(segmentColors[segment])
            .setTitle(`🔫 Média Online - ${segment}`)
            .setThumbnail(imageUrl)
            .setDescription(Object.entries(faccoes)
                .map(([faccao, online]) => `${faccao}: ${online}`)
                .join('\n')
            );

        embeds.push(embed);
    }

    // Adicionando a data/hora atual
    const currentDateTime = new Date().toLocaleString();
    const footerEmbed = new EmbedBuilder()
        .setColor('#000000')
        .setDescription(`Atualizado em: ${currentDateTime}`);

    // Enviar a mensagem com os embeds para o canal onde o comando foi ativado
    try {
        await channel.send({ embeds: [...embeds, footerEmbed] });
        console.log(`Relatório enviado para ${channel.id}`);
    } catch (error) {
        console.error(`Erro ao enviar mensagem para o canal: ${error}`);
    }
};

client.on('messageCreate', async (message) => {
    console.log(`Mensagem recebida: ${message.content}`); // Log para depuração

    // Ignora mensagens que são do bot
    if (message.author.bot) return;

    // Verifica se a mensagem é o comando .org
    if (message.content.trim() === '.org') {
        await message.channel.send('Comando .org ativado!');
        console.log('Comando .org ativado!');
        
        // Envia o relatório para o canal onde o comando foi ativado
        await sendReport(message.channel);
        
        return;
    }

    // Verifica a hora atual
    const currentTime = new Date();
    const isAfterCutoff = currentTime.getHours() > 20 || (currentTime.getHours() === 20 && currentTime.getMinutes() >= 58);
    
    // Verifica se a mensagem foi enviada após a data de início
    const messageDate = new Date(message.createdTimestamp);
    if (messageDate < startDate) {
        console.log(`Mensagem ignorada, enviada antes da data de início: ${message.content}`);
        return; 
    }

    // Se não for o usuário permitido, verificar o horário
    if (message.author.id !== allowedUserId && !isAfterCutoff) {
        console.log(`Mensagem ignorada, não permitido: ${message.content}`);
        return; 
    }

    // Extrair as informações da mensagem
    const regex = /\[(.*?)\]: Membros Online = (\d+)/g;
    let match;

    while ((match = regex.exec(message.content)) !== null) {
        const faccao = match[1].trim();
        const online = parseInt(match[2]);

        // Verifica em qual segmento a facção está e soma os membros online
        for (const segment in segments) {
            if (segments[segment].hasOwnProperty(faccao)) {
                segments[segment][faccao] += online;
                console.log(`Adicionando ${online} membros a ${faccao} em ${segment}`);
            }
        }
    }

    // Enviar o relatório após atualizar os quantitativos
    await sendReport(message.channel);
});

// Substitua pelo seu token
client.login(process.env.BOT_TOKEN); // Utilizar variável de ambiente para o token
