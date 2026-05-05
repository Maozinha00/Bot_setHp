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

// 🌐 LINK DISCORD
const DISCORD_LINK = "https://discord.gg/y6tJAK3fF5"; // TROCA

// 🎖️ CARGOS
const ROLE_PARAMEDICO_ID = "1477683902079303934";
const ROLE_MEMBRO_HP_ID = "1477683902079303932";

// 📌 CANAIS
const REQUEST_CHANNEL_ID = "1495178025602515177";
const APPROVAL_CHANNEL_ID = "1497304750214090846";

// 🤖 BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 📌 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName("painelset")
    .setDescription("Abrir painel de recrutamento")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("limpar")
    .setDescription("Apagar mensagens")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("1-100")
        .setRequired(true)
    )
    .toJSON()
];

// 🚀 REGISTRO
const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`🤖 Online: ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("✅ Comandos registrados!");
});

// =========================
// 📌 INTERAÇÕES
// =========================
client.on("interactionCreate", async (interaction) => {

  // ===== COMANDOS =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "painelset") {

      const embed = new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("🏥 HOSPITAL BELLA")
        .setDescription(
`━━━━━━━━━━━━━━━━━━━
👨‍⚕️ RECRUTAMENTO HP

Clique abaixo para se cadastrar.
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

    if (interaction.commandName === "limpar") {

      const quantidade = interaction.options.getInteger("quantidade");

      if (!interaction.member.roles.cache.has(LEADER_ROLE_ID)) {
        return interaction.reply({ content: "❌ Sem permissão", flags: 64 });
      }

      await interaction.channel.bulkDelete(quantidade, true);

      return interaction.reply({
        content: `🧹 ${quantidade} apagadas`,
        flags: 64
      });
    }
  }

  // ===== MODAL =====
  if (interaction.isButton() && interaction.customId === "abrir_set") {

    const modal = new ModalBuilder()
      .setCustomId("form_set")
      .setTitle("Cadastro");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("Nome")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("exp")
          .setLabel("Experiência")
          .setStyle(TextInputStyle.Paragraph)
      )
    );

    return interaction.showModal(modal);
  }

  // ===== ENVIO =====
  if (interaction.isModalSubmit()) {

    const nome = interaction.fields.getTextInputValue("nome");
    const id = interaction.fields.getTextInputValue("id");
    const exp = interaction.fields.getTextInputValue("exp");

    const canal = interaction.guild.channels.cache.get(APPROVAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setColor("#facc15")
      .setTitle("📋 NOVO CADASTRO")
      .addFields(
        { name: "Nome", value: nome },
        { name: "ID", value: id },
        { name: "Exp", value: exp }
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

    // 📩 DM ENVIO
    try {
      await interaction.user.send(
`📨 Solicitação enviada!

🌐 ${DISCORD_LINK}`
      );
    } catch {}

    return interaction.reply({
      content: "📨 Enviado! Veja seu privado",
      flags: 64
    });
  }

  // ===== APROVAR / RECUSAR =====
  if (interaction.isButton()) {

    const [acao, userId] = interaction.customId.split("_");
    const membro = await interaction.guild.members.fetch(userId);

    const embed = interaction.message.embeds[0];
    const nome = embed.fields[0].value;
    const id = embed.fields[1].value;

    if (acao === "recusar") {

      try {
        await membro.send(`❌ Reprovado\n🌐 ${DISCORD_LINK}`);
      } catch {}

      return interaction.reply({ content: "❌ Recusado", flags: 64 });
    }

    if (acao === "aprovar") {

      await membro.roles.add([ROLE_PARAMEDICO_ID, ROLE_MEMBRO_HP_ID]).catch(() => {});

      try {
        await membro.send(`✅ Aprovado!\n🌐 ${DISCORD_LINK}`);
      } catch {}

      return interaction.reply({ content: "✅ Aprovado", flags: 64 });
    }
  }
});

// LOGIN
client.login(TOKEN);
