import "dotenv/config";
import express from "express";
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

/* =========================
   🌐 KEEP ALIVE
========================= */
const app = express();
app.get("/", (_, res) => res.send("Bot online 🔥"));
app.listen(3000, () => console.log("🌐 Web server ativo"));

/* =========================
   🔐 CONFIG
========================= */
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LEADER_ROLE_ID = process.env.LEADER_ROLE_ID;

/* =========================
   🎖️ CARGOS
========================= */
const ROLE_PARAMEDICO_ID = "1477683902079303934";
const ROLE_MEMBRO_HP_ID = "1477683902079303932";

/* =========================
   📌 CANAIS
========================= */
const ANALISE_CHANNEL_ID = "1497304750214090846";
const PRONTUARIO_CHANNEL_ID = "1495178025602515177";

/* =========================
   🤖 BOT
========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================
   📌 COMANDOS
========================= */
const commands = [

  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel de setagem HP")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Apagar mensagens do canal")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("Quantidade (1-100)")
        .setRequired(true)
    )
    .toJSON()

];

/* =========================
   🚀 REGISTRO
========================= */
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Comandos registrados!");
});

/* =========================
   📌 INTERAÇÕES
========================= */
client.on("interactionCreate", async (interaction) => {

  /* =========================
     📌 COMANDOS
  ========================= */
  if (interaction.isChatInputCommand()) {

    // =========================
    // 📂 PAINEL SETAGEM (ESTILO IMAGEM)
    // =========================
    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#5b0f0f")
        .setTitle("📂 SOLICITAR SETAGEM")
        .setDescription(
`Para solicitar uma setagem, clique no botão abaixo e preencha as informações solicitadas.

⚠️ Caso ocorra algum problema, abra um ticket
⚠️ Não solicite mais de uma setagem por vez
📨 Após a solicitação, será enviado para análise.`
        )
        .setFooter({ text: "Sistema Hospitalar • HP" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pedir_set")
          .setLabel("📥 Pedir SET")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    // =========================
    // 🧹 LIMPAR (ORIGINAL)
    // =========================
    if (interaction.commandName === "limpar") {

      const quantidade = interaction.options.getInteger("quantidade");

      if (quantidade < 1 || quantidade > 100) {
        return interaction.reply({
          content: "❌ Escolha entre 1 e 100 mensagens.",
          flags: 64
        });
      }

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Você não tem permissão.",
          flags: 64
        });
      }

      try {
        await interaction.channel.bulkDelete(quantidade, true);

        return interaction.reply({
          content: `🧹 ${quantidade} mensagens apagadas!`,
          flags: 64
        });

      } catch {
        return interaction.reply({
          content: "❌ Erro ao apagar mensagens.",
          flags: 64
        });
      }
    }
  }

  /* =========================
     📋 MODAL
  ========================= */
  if (interaction.isButton() && interaction.customId === "pedir_set") {

    const modal = new ModalBuilder()
      .setCustomId("modal_set")
      .setTitle("Solicitação de Setagem");

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
          .setCustomId("experiencia")
          .setLabel("Experiência")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* =========================
     📨 ENVIO PRA ANÁLISE
  ========================= */
  if (interaction.isModalSubmit() && interaction.customId === "modal_set") {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const experiencia = interaction.fields.getTextInputValue("experiencia");

    const canal = interaction.guild.channels.cache.get(ANALISE_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📨 NOVA SOLICITAÇÃO")
      .addFields(
        { name: "👤 Nome", value: nome },
        { name: "🆔 ID", value: id },
        { name: "🩺 Experiência", value: experiencia },
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

    // 🔥 IGUAL DA IMAGEM (mensagem privada)
    return interaction.reply({
      content: "📨 Sua solicitação de setagem foi enviada para análise!",
      flags: 64
    });
  }

  /* =========================
     ✅ APROVAR / ❌ RECUSAR
  ========================= */
  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("aprovar_") ||
     interaction.customId.startsWith("recusar_"))
  ) {

    await interaction.deferReply({ flags: 64 });

    if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
      return interaction.editReply("❌ Sem permissão.");
    }

    const [acao, userId] = interaction.customId.split("_");
    const membro = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    await interaction.message.delete().catch(() => {});

    if (acao === "recusar") {
      return interaction.editReply(`❌ REPROVADO\n👤 ${nome}`);
    }

    if (acao === "aprovar") {

      await membro.roles.add([
        ROLE_PARAMEDICO_ID,
        ROLE_MEMBRO_HP_ID
      ]).catch(() => {});

      let nick = `${nome} | ${id}`;
      if (nick.length > 32) nick = nick.slice(0, 32);

      await membro.setNickname(nick).catch(() => {});

      const prontuario = interaction.guild.channels.cache.get(PRONTUARIO_CHANNEL_ID);

      await prontuario.send(
`📁 PRONTUÁRIO MÉDICO
━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🆔 ID: ${id}
👨‍⚕️ Aprovado por: <@${interaction.user.id}>
━━━━━━━━━━━━━━━━━━━`
      );

      return interaction.editReply(`✅ APROVADO\n👤 ${nome}`);
    }
  }
});

/* =========================
   🔑 LOGIN
========================= */
client.login(TOKEN);

/* =========================
   💥 ANTI-CRASH
========================= */
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
