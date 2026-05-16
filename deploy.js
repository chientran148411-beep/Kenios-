const {
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const config = require("./config.json");

const commands = [

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Admin panel"),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Mua sản phẩm")

].map(c => c.toJSON());

const rest = new REST({
  version: "10"
}).setToken(config.token);

(async () => {

  await rest.put(
    Routes.applicationGuildCommands(
      config.clientId,
      config.guildId
    ),
    { body: commands }
  );

  console.log("Slash command loaded");

})();
