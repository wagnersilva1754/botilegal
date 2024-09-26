const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Necessário para ler o conteúdo das mensagens
    ]
});

// Definindo as facções e suas respectivas categorias
const faccoes = {
    "Lavagem": [
        "BAHAMAS",
        "TOMORROWLAND",
        "LUXURY",
        "CASABLANCA",
        "ELDORADO",
        "PARADISE",
        "INFINITY",
        "ABSOLUT"
    ],
    "Desmanche": [
        "MC",
        "FURIOUS",
        "SUBLIME",
        "BENNYS",
        "STREETRACE",
        "LSCUSTOMS",
        "UNDERGROUND",
        "CAMORRA",
        "DRIFTKING"
    ],
    "Armas": [
        "CDI",
        "UMBRELLA",
        "YAKUZA",
        "MAFIA",
        "MERCENARIOS",
        "GROTTA",
        "CORLEONE",
        "ANONYMOUS",
        "HELIPA",
        "CV",
        "BLOODS"
    ],
    "Munição": [
        "DRAGONS",
        "MEDELLIN",
        "MILICIA",
        "BRATVA",
        "VIDIGAL",
        "ABUTRES",
        "PCC",
        "OKAIDA",
        "OMEGA",
        "CARTEL",
        "TRIADE",
        "SINALOA",
        "FAMILIES"
    ]
};

// Armazenando as associações de usuários com facções
const userFaccoes = {};

// Evento quando o bot estiver pronto
client.once(Events.ClientReady, () => {
    console.log(`Logado como ${client.user.tag}`);
});

// Variável para armazenar as mensagens de hierarquia
let previousMessages = [];

// Comando para criar a hierarquia
client.on(Events.MessageCreate, async message => {
    // Comando para exibir a hierarquia
    if (message.content === '.cargo') {
        // Apaga todas as mensagens anteriores de hierarquia
        await deletePreviousMessages(message.channel);

        // Cria novos embeds para cada facção
        createFactionEmbeds(message);
    }

    // Comando para adicionar usuário à facção
    const setCommand = message.content.match(/\.set <@!?(\d+)> (\w+)/);
    if (setCommand) {
        const userId = setCommand[1];
        const faccao = setCommand[2].toUpperCase(); // Converte para maiúsculas para comparação

        addUserToFaction(userId, faccao, message);
    }

    // Comando para demitir usuário da facção
    const demitirCommand = message.content.match(/\.demitir <@!?(\d+)> (\w+)/);
    if (demitirCommand) {
        const userId = demitirCommand[1];
        const faccao = demitirCommand[2].toUpperCase(); // Converte para maiúsculas para comparação

        removeUserFromFaction(userId, faccao, message);
    }
});

// Função para criar um embed separado para cada facção
async function createFactionEmbeds(message) {
    Object.keys(faccoes).forEach(categoria => {
        const faccoesList = faccoes[categoria].map(faccao => {
            // Adiciona os usuários que pertencem a essa facção
            const membros = userFaccoes[categoria]?.[faccao] || [];
            return `${faccao}\n${membros.join('\n')}`; // Formata a lista
        }).join('\n\n'); // Junta as facções

        const embed = new EmbedBuilder()
            .setTitle(`Facções de ${categoria}`)
            .setDescription(`Aqui estão as facções na categoria **${categoria}**:\n${faccoesList}`)
            .setColor('#3498db')
            .setThumbnail('https://i.ibb.co/yqQqQH6/cpx-fund-ilegal.webp') // Logo do título
            .setTimestamp();

        // Envia o embed e armazena a mensagem para possível exclusão
        message.channel.send({ embeds: [embed] }).then(sentMessage => {
            previousMessages.push(sentMessage); // Armazena a mensagem enviada
        });
    });
}

// Função para apagar mensagens anteriores de hierarquia
async function deletePreviousMessages(channel) {
    // Apaga todas as mensagens armazenadas
    for (const msg of previousMessages) {
        await msg.delete().catch(console.error); // Ignora erro se não puder deletar
    }
    previousMessages = []; // Limpa o array de mensagens
}

// Função para adicionar um usuário a uma facção
function addUserToFaction(userId, faccao, message) {
    // Verificando se a facção existe
    const faccaoExists = Object.values(faccoes).flat().includes(faccao);
    if (!faccaoExists) {
        return message.channel.send(`Facção **${faccao}** não encontrada.`);
    }

    // Encontrando a categoria da facção
    const categoria = Object.keys(faccoes).find(cat => faccoes[cat].includes(faccao));

    // Inicializando a lista de membros se não existir
    if (!userFaccoes[categoria]) {
        userFaccoes[categoria] = {};
    }
    if (!userFaccoes[categoria][faccao]) {
        userFaccoes[categoria][faccao] = [];
    }

    // Adicionando o usuário à lista, se ainda não estiver presente
    const userMention = `<@${userId}>`;
    if (!userFaccoes[categoria][faccao].includes(userMention)) {
        userFaccoes[categoria][faccao].push(userMention);
        message.channel.send(`Usuário ${userMention} adicionado à facção **${faccao}**.`);
        createFactionEmbeds(message); // Atualiza a hierarquia após adicionar o usuário
    } else {
        message.channel.send(`Usuário ${userMention} já está na facção **${faccao}**.`);
    }
}

// Função para remover um usuário de uma facção
function removeUserFromFaction(userId, faccao, message) {
    // Verificando se a facção existe
    const faccaoExists = Object.values(faccoes).flat().includes(faccao);
    if (!faccaoExists) {
        return message.channel.send(`Facção **${faccao}** não encontrada.`);
    }

    // Encontrando a categoria da facção
    const categoria = Object.keys(faccoes).find(cat => faccoes[cat].includes(faccao));
    const userMention = `<@${userId}>`;

    // Removendo o usuário da facção
    if (userFaccoes[categoria]?.[faccao]?.includes(userMention)) {
        userFaccoes[categoria][faccao] = userFaccoes[categoria][faccao].filter(member => member !== userMention);
        message.channel.send(`Usuário ${userMention} demitido da facção **${faccao}**.`);
        createFactionEmbeds(message); // Atualiza a hierarquia após demitir o usuário
    } else {
        message.channel.send(`Usuário ${userMention} não está na facção **${faccao}**.`);
    }
}



client.login('MTI3NzM1NTgzNjA5NTU5ODYxNQ.Gho-6H.c8uHV_iSjFKhnzS5ICtfpR_k09erApOyY1c0yk');