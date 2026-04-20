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

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CANAL_LOG = '1495178025602515177';
const CANAL_APROVADOS = '1495790507182522450';
const CARGO_ID = '1495178024759332915';
// ==========================================

if (!TOKEN) {
    console.error("❌ TOKEN NÃO DEFINIDO!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// ========= ONLINE =========
client.once(Events.ClientReady, () => {
    console.log(`🔥 ${client.user.tag} ONLINE`);
});

// ========= PAINEL =========
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setpainel') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_form')
                .setLabel('📋 Pedir Set')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({
            content: "🏥 **HOSPITAL BELLA RP**\nClique para solicitar seu cargo:",
            components: [row]
        });
    }
});

// ========= INTERAÇÕES =========
client.on(Events.InteractionCreate, async (interaction) => {
    try {

        // ===== FORM =====
        if (interaction.isButton() && interaction.customId === 'abrir_form') {

            const modal = new ModalBuilder()
                .setCustomId('form_set')
                .setTitle('📋 Pedido de Set');

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

        // ===== ENVIO =====
        if (interaction.isModalSubmit() && interaction.customId === 'form_set') {

            const canal = await client.channels.fetch(CANAL_LOG).catch(() => null);

            if (!canal) {
                return interaction.reply({ content: "❌ Canal inválido", ephemeral: true });
            }

            const dados = {
                user: interaction.user.id,
                id: interaction.fields.getTextInputValue('id'),
                nome: interaction.fields.getTextInputValue('nome'),
                unidade: interaction.fields.getTextInputValue('unidade'),
                cargo: interaction.fields.getTextInputValue('cargo'),
                responsavel: interaction.fields.getTextInputValue('responsavel')
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`aprovar_${dados.user}`)
                    .setLabel('✅ Aprovar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reprovar_${dados.user}`)
                    .setLabel('❌ Reprovar')
                    .setStyle(ButtonStyle.Danger)
            );

            await canal.send({
                content:
                `📋 **PEDIDO DE SET**\n\n` +
                "```" +
                `Nome: ${dados.nome}\n` +
                `ID: ${dados.id}\n` +
                `Unidade: ${dados.unidade}\n` +
                `Cargo: ${dados.cargo}\n` +
                `Responsável: ${dados.responsavel}\n` +
                "```" +
                `\n👤 Usuário: <@${dados.user}>\n` +
                `⏳ Status: Pendente`,
                components: [row]
            });

            return interaction.reply({
                content: "✅ Pedido enviado!",
                ephemeral: true
            });
        }

        // ===== APROVAR =====
        if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {

            const userId = interaction.customId.split('_')[1];
            const membro = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!membro) {
                return interaction.reply({ content: "❌ Usuário não encontrado", ephemeral: true });
            }

            // cargo
            await membro.roles.add(CARGO_ID).catch(() => null);

            // DM
            await membro.send("✅ Seu set foi aprovado!").catch(() => null);

            // LOG APROVADO
            const canalAprovados = await client.channels.fetch(CANAL_APROVADOS).catch(() => null);

            if (canalAprovados) {
                await canalAprovados.send(
                    `✅ **SET APROVADO**\n\n👤 <@${userId}>\n👮 Staff: <@${interaction.user.id}>`
                );
            }

            return interaction.update({
                content: interaction.message.content.replace('Pendente', `Aprovado por <@${interaction.user.id}> ✅`),
                components: []
            });
        }

        // ===== REPROVAR =====
        if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {

            const userId = interaction.customId.split('_')[1];
            const membro = await interaction.guild.members.fetch(userId).catch(() => null);

            if (membro) {
                await membro.send("❌ Seu pedido foi recusado.").catch(() => null);
            }

            return interaction.update({
                content: interaction.message.content.replace('Pendente', `Reprovado por <@${interaction.user.id}> ❌`),
                components: []
            });
        }

    } catch (err) {
        console.error("🚨 ERRO:", err);
    }
});

// LOGIN
client.login(TOKEN);

// ANTI-CRASH
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
