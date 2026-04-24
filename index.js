import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

// 🔐 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const LEADER_ROLE_ID = process.env.LEADER_ROLE_ID;

// 🎖️ CARGOS
const ROLE_PARAMEDICO_ID = "1477683902079303934";
const ROLE_MEMBRO_HP_ID = "1477683902079303932";

// 📌 CANAIS (PEGOS DO OUTRO BOT)
const REQUEST_CHANNEL_ID = "1495178025602515177"; // LOG / PRONTUÁRIO
const APPROVAL_CHANNEL_ID = "1495790507182522450"; // APROVAÇÃO

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 📌 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel do Hospital Bella")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Apagar mensagens")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("1 a 100")
        .setRequired(true)
    )
    .toJSON()
];

// 🚀 REGISTRO
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("clientReady", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // ================= COMANDOS =================
  if (interaction.isChatInputCommand()) {

    // ===== PAINEL =====
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("🏥 HOSPITAL BELLA")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
👨‍⚕️ **RECRUTAMENTO HP**

Entre para a equipe médica.

Clique abaixo para iniciar seu cadastro.
━━━━━━━━━━━━━━━━━━━`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("abrir_set")
          .setLabel("📋 Fazer Cadastro")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // ===== LIMPAR =====
    if (interaction.commandName === "limpar") {

      const quantidade = interaction.options.getInteger("quantidade");

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({ content: "❌ Sem permissão.", flags: 64 });
      }

      await interaction.channel.bulkDelete(quantidade, true);

      return interaction.reply({
        content: `🧹 ${quantidade} mensagens apagadas`,
        flags: 64
      });
    }
  }

  // ================= FORM =================
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Cadastro Hospital");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("Nome RP")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("exp")
          .setLabel("Experiência")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // ================= ENVIO =================
  if (interaction.isModalSubmit() && interaction.customId === "form_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const exp = interaction.fields.getTextInputValue("exp");

    const canal = await client.channels.fetch(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📋 NOVO CADASTRO")
      .addFields(
        { name: "Nome", value: nome },
        { name: "ID", value: id },
        { name: "Experiência", value: exp },
        { name: "Discord", value: `<@${interaction.user.id}>` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprovar_${interaction.user.id}`)
        .setLabel("Aprovar")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await canal.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📨 Enviado para análise!",
      flags: 64
    });
  }

  // ================= APROVAR =================
  if (interaction.isButton() && interaction.customId.startsWith("aprovar_")) {

    await interaction.deferReply({ flags: 64 });

    const userId = interaction.customId.split("_")[1];
    const membro = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    await membro.roles.add([
      ROLE_PARAMEDICO_ID,
      ROLE_MEMBRO_HP_ID
    ]);

    let nick = `${nome} | ${id}`;
    if (nick.length > 32) nick = nick.slice(0, 32);

    await membro.setNickname(nick).catch(() => {});

    const canalLog = await client.channels.fetch(REQUEST_CHANNEL_ID);

    await canalLog.send(
`📁 **PRONTUÁRIO MÉDICO**
━━━━━━━━━━━━━━━━━━━
👤 ${nome}
🆔 ${id}
🏷️ ${nick}
🩺 Paramédico
👨‍⚕️ Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━`
    );

    await interaction.message.delete().catch(() => {});

    return interaction.editReply("✅ Aprovado!");
  }

  // ================= RECUSAR =================
  if (interaction.isButton() && interaction.customId.startsWith("recusar_")) {

    await interaction.message.delete().catch(() => {});

    return interaction.reply({
      content: "❌ Reprovado",
      flags: 64
    });
  }
});

// LOGIN
client.login(TOKEN);

// ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
