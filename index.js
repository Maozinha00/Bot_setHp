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
        GatewayIntentBits.GuildMessages
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} está online!`);
});

// COMANDO PARA CRIAR O PAINEL
client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!setpainel') {

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_form')
                .setLabel('📋 Fazer Cadastro')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: "🏥 **HOSPITAL BELLA**\nClique no botão abaixo para fazer o cadastro:",
            components: [botao]
        });
    }
});

// INTERAÇÃO (BOTÃO + MODAL)
client.on(Events.InteractionCreate, async (interaction) => {

    // CLICOU NO BOTÃO
    if (interaction.isButton()) {
        if (interaction.customId === 'abrir_form') {

            const modal = new ModalBuilder()
                .setCustomId('form_funcionario')
                .setTitle('📋 Cadastro de Funcionário');

            const id = new TextInputBuilder()
                .setCustomId('id')
                .setLabel('ID')
                .setStyle(TextInputStyle.Short);

            const nome = new TextInputBuilder()
                .setCustomId('nome')
                .setLabel('Nome')
                .setStyle(TextInputStyle.Short);

            const unidade = new TextInputBuilder()
                .setCustomId('unidade')
                .setLabel('Unidade')
                .setStyle(TextInputStyle.Short);

            const cargo = new TextInputBuilder()
                .setCustomId('cargo')
                .setLabel('Cargo')
                .setStyle(TextInputStyle.Short);

            const responsavel = new TextInputBuilder()
                .setCustomId('responsavel')
                .setLabel('Responsável (@)')
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(id),
                new ActionRowBuilder().addComponents(nome),
                new ActionRowBuilder().addComponents(unidade),
                new ActionRowBuilder().addComponents(cargo),
                new ActionRowBuilder().addComponents(responsavel)
            );

            await interaction.showModal(modal);
        }
    }

    // ENVIO DO FORMULÁRIO
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'form_funcionario') {

            const id = interaction.fields.getTextInputValue('id');
            const nome = interaction.fields.getTextInputValue('nome');
            const unidade = interaction.fields.getTextInputValue('unidade');
            const cargo = interaction.fields.getTextInputValue('cargo');
            const responsavel = interaction.fields.getTextInputValue('responsavel');

            await interaction.reply({
                content:
                `🏥 **NOVO FUNCIONÁRIO REGISTRADO**\n\n` +
                `🆔 ID: ${id}\n` +
                `👤 Nome: ${nome}\n` +
                `🏥 Unidade: ${unidade}\n` +
                `💼 Cargo: ${cargo}\n` +
                `📌 Responsável: ${responsavel}`,
                ephemeral: false
            });
        }
    }
});

client.login('SEU_TOKEN_AQUI');
