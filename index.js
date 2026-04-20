const {
    Client,
    GatewayIntentBits,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // 🔥 ESSENCIAL
    ]
});

// 🔧 CONFIG (Railway Variables)
const TOKEN = process.env.TOKEN;
const CANAL_LOG = '1495178025602515177';

// ONLINE
client.once(Events.ClientReady, () => {
    console.log(`🔥 ${client.user.tag} ONLINE`);
});

// PAINEL
client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!setpainel' && !message.author.bot) {

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('pedir_set')
                .setLabel('📋 Pedir Set')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: "🏥 **HOSPITAL BELLA - PEDIR SET**\nClique abaixo para solicitar:",
            components: [botao]
        });
    }
});

// INTERAÇÕES
client.on(Events.InteractionCreate, async (interaction) => {
    try {

        // ABRIR FORM
        if (interaction.isButton() && interaction.customId === 'pedir_set') {

            const modal = new ModalBuilder()
                .setCustomId('form_set')
                .setTitle('📋 Solicitação de Set');

            const criarCampo = (id, label) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                );

            modal.addComponents(
                criarCampo('id', 'ID'),
                criarCampo('nome', 'Nome'),
                criarCampo('unidade', 'Unidade'),
                criarCampo('cargo', 'Cargo desejado'),
                criarCampo('responsavel', 'Responsável (@)')
            );

            return interaction.showModal(modal);
        }

        // ENVIO FORM
        if (interaction.isModalSubmit() && interaction.customId === 'form_set') {

            const dados = {
                id: interaction.fields.getTextInputValue('id'),
                nome: interaction.fields.getTextInputValue('nome'),
                unidade: interaction.fields.getTextInputValue('unidade'),
                cargo: interaction.fields.getTextInputValue('cargo'),
                responsavel: interaction.fields.getTextInputValue('responsavel')
            };

            const canal = await client.channels.fetch(CANAL_LOG).catch(() => null);

            if (!canal) {
                return interaction.reply({ content: "❌ Canal inválido!", ephemeral: true });
            }

            const botoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('aprovar')
                    .setLabel('✅ Aprovar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('reprovar')
                    .setLabel('❌ Reprovar')
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({
                content:
                `📋 **NOVO PEDIDO DE SET**\n\n` +
                `🆔 ID: ${dados.id}\n` +
                `👤 Nome: ${dados.nome}\n` +
                `🏥 Unidade: ${dados.unidade}\n` +
                `💼 Cargo: ${dados.cargo}\n` +
                `📌 Responsável: ${dados.responsavel}\n\n` +
                `⏳ Status: Pendente`,
                components: [botoes]
            });

            return interaction.reply({
                content: "✅ Pedido enviado!",
                ephemeral: true
            });
        }

        // APROVAR
        if (interaction.isButton() && interaction.customId === 'aprovar') {
            return interaction.update({
                content: interaction.message.content.replace('Pendente', 'Aprovado ✅'),
                components: []
            });
        }

        // REPROVAR
        if (interaction.isButton() && interaction.customId === 'reprovar') {
            return interaction.update({
                content: interaction.message.content.replace('Pendente', 'Reprovado ❌'),
                components: []
            });
        }

    } catch (err) {
        console.error('ERRO:', err);
    }
});

// LOGIN
client.login(TOKEN);

// ANTI CRASH
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
