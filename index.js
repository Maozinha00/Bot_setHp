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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// 🔧 CONFIG
const TOKEN = process.env.TOKEN;
const CANAL_LOG = '1495178025602515177';
const CARGO_ID = '1495178024759332915';

// 🔐 VERIFICA TOKEN
if (!TOKEN) {
    console.error("❌ TOKEN NÃO DEFINIDO");
    process.exit(1);
}

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
            content: "🏥 **HOSPITAL BELLA - SET RP**\nClique abaixo para solicitar seu cargo:",
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

            const campo = (id, label) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                );

            modal.addComponents(
                campo('id', 'ID'),
                campo('nome', 'Nome'),
                campo('unidade', 'Unidade'),
                campo('cargo', 'Cargo desejado'),
                campo('responsavel', 'Responsável (@)')
            );

            return interaction.showModal(modal);
        }

        // ENVIO FORM
        if (interaction.isModalSubmit() && interaction.customId === 'form_set') {

            const canal = await client.channels.fetch(CANAL_LOG).catch(() => null);

            if (!canal || !canal.isTextBased()) {
                return interaction.reply({ content: "❌ Canal inválido.", ephemeral: true });
            }

            const dados = {
                id: interaction.fields.getTextInputValue('id'),
                nome: interaction.fields.getTextInputValue('nome'),
                unidade: interaction.fields.getTextInputValue('unidade'),
                cargo: interaction.fields.getTextInputValue('cargo'),
                responsavel: interaction.fields.getTextInputValue('responsavel')
            };

            const botoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`aprovar_${interaction.user.id}`)
                    .setLabel('✅ Aprovar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reprovar_${interaction.user.id}`)
                    .setLabel('❌ Reprovar')
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({
                content:
                `📋 **NOVO PEDIDO DE SET**\n\n` +
                `👤 Solicitante: <@${interaction.user.id}>\n` +
                `🆔 ID: ${dados.id}\n` +
                `👤 Nome: ${dados.nome}\n` +
                `🏥 Unidade: ${dados.unidade}\n` +
                `💼 Cargo: ${dados.cargo}\n` +
                `📌 Responsável: ${dados.responsavel}\n\n` +
                `⏳ Status: Pendente`,
                components: [botoes]
            });

            return interaction.reply({
                content: "✅ Seu pedido foi enviado!",
                ephemeral: true
            });
        }

        // APROVAR
        if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {

            const userId = interaction.customId.split('_')[1];
            const membro = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!membro) {
                return interaction.reply({ content: "❌ Usuário não encontrado.", ephemeral: true });
            }

            await membro.roles.add(CARGO_ID).catch(() => null);

            await membro.send(`✅ Seu set foi aprovado no hospital!`).catch(() => null);

            return interaction.update({
                content:
                interaction.message.content.replace('Pendente', `Aprovado por <@${interaction.user.id}> ✅`),
                components: []
            });
        }

        // REPROVAR
        if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {

            const userId = interaction.customId.split('_')[1];
            const membro = await interaction.guild.members.fetch(userId).catch(() => null);

            if (membro) {
                await membro.send(`❌ Seu pedido de set foi recusado.`).catch(() => null);
            }

            return interaction.update({
                content:
                interaction.message.content.replace('Pendente', `Reprovado por <@${interaction.user.id}> ❌`),
                components: []
            });
        }

    } catch (err) {
        console.error("ERRO:", err);
    }
});

// LOGIN
client.login(TOKEN);

// ANTI-CRASH
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
