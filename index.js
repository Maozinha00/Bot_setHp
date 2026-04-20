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

const CANAL_LOG = '1495178025602515177';

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} está online!`);
});

// PAINEL
client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!setpainel') {

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('pedir_set')
                .setLabel('📋 Pedir Set')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: "🏥 **HOSPITAL BELLA - PEDIR SET**\nClique abaixo para solicitar seu cargo:",
            components: [botao]
        });
    }
});

// INTERAÇÕES
client.on(Events.InteractionCreate, async (interaction) => {

    // BOTÃO
    if (interaction.isButton()) {
        if (interaction.customId === 'pedir_set') {

            const modal = new ModalBuilder()
                .setCustomId('form_set')
                .setTitle('📋 Solicitação de Set');

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
                .setLabel('Cargo desejado')
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

    // ENVIO
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'form_set') {

            const id = interaction.fields.getTextInputValue('id');
            const nome = interaction.fields.getTextInputValue('nome');
            const unidade = interaction.fields.getTextInputValue('unidade');
            const cargo = interaction.fields.getTextInputValue('cargo');
            const responsavel = interaction.fields.getTextInputValue('responsavel');

            const canal = await client.channels.fetch(CANAL_LOG);

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
                `🆔 ID: ${id}\n` +
                `👤 Nome: ${nome}\n` +
                `🏥 Unidade: ${unidade}\n` +
                `💼 Cargo: ${cargo}\n` +
                `📌 Responsável: ${responsavel}\n\n` +
                `⏳ Status: Pendente`,
                components: [botoes]
            });

            await interaction.reply({
                content: "✅ Seu pedido foi enviado para análise!",
                ephemeral: true
            });
        }
    }

    // APROVAR
    if (interaction.isButton() && interaction.customId === 'aprovar') {

        await interaction.update({
            content: interaction.message.content.replace('Pendente', 'Aprovado ✅'),
            components: []
        });
    }

    // REPROVAR
    if (interaction.isButton() && interaction.customId === 'reprovar') {

        await interaction.update({
            content: interaction.message.content.replace('Pendente', 'Reprovado ❌'),
            components: []
        });
    }

});

client.login('SEU_TOKEN_AQUI');
