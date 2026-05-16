const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const express = require("express");
const fs = require("fs-extra");
const QRCode = require("qrcode");

const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const app = express();

app.use(express.json());

function loadProducts() {
  return fs.readJsonSync("./products.json");
}

function loadKeys() {
  return fs.readJsonSync("./keys.json");
}

function saveKeys(data) {
  fs.writeJsonSync("./keys.json", data, {
    spaces: 2
  });
}

function loadOrders() {
  return fs.readJsonSync("./orders.json");
}

function saveOrders(data) {
  fs.writeJsonSync("./orders.json", data, {
    spaces: 2
  });
}

client.once("ready", () => {
  console.log(`${client.user.tag} ONLINE`);
});

client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "panel") {

      if (interaction.user.id !== config.adminId) {
        return interaction.reply({
          content: "Bạn không phải admin",
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("⚙️ ADMIN PANEL")
        .setDescription(`
📂 DANH MỤC
📦 SẢN PHẨM
🔑 KEY
📊 HỆ THỐNG
`);

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId("addsp")
            .setLabel("📦 Thêm SP")
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId("addkey")
            .setLabel("🔑 Nhập Key")
            .setStyle(ButtonStyle.Success)
        );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    if (interaction.commandName === "buy") {

      const products = loadProducts();

      const product = products[0];

      const orderId = Date.now().toString();

      const transferContent = `NAP ${orderId}`;

      const qrText = `
BANK:${config.bankName}
STK:${config.bankNumber}
AMOUNT:${product.price}
ND:${transferContent}
`;

      const qrImage = await QRCode.toDataURL(qrText);

      const orders = loadOrders();

      orders.push({
        orderId,
        userId: interaction.user.id,
        productId: product.id,
        paid: false
      });

      saveOrders(orders);

      const embed = new EmbedBuilder()
        .setTitle("🧾 THANH TOÁN")
        .setDescription(`
📦 Sản phẩm: ${product.name}

💰 Giá: ${product.price}đ

⏰ Thời gian:
${product.duration}

📝 Nội dung CK:
\`${transferContent}\`
`);

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId(`check_${orderId}`)
            .setLabel("✅ Kiểm Tra Thanh Toán")
            .setStyle(ButtonStyle.Success)
        );

      await interaction.reply({
        embeds: [embed],
        files: [{
          attachment: Buffer.from(
            qrImage.split(",")[1],
            "base64"
          ),
          name: "qr.png"
        }],
        components: [row]
      });
    }
  }

  if (interaction.isButton()) {

    if (interaction.customId.startsWith("check_")) {

      const orderId =
        interaction.customId.split("_")[1];

      const orders = loadOrders();

      const order = orders.find(
        x => x.orderId === orderId
      );

      if (!order) {

        return interaction.reply({
          content: "Không tìm thấy đơn",
          ephemeral: true
        });
      }

      if (!order.paid) {

        return interaction.reply({
          content: "❌ Chưa thanh toán",
          ephemeral: true
        });
      }

      const keys = loadKeys();

      const productKeys =
        keys[order.productId];

      if (!productKeys ||
          !productKeys.length) {

        return interaction.reply({
          content: "Hết key",
          ephemeral: true
        });
      }

      const key = productKeys.shift();

      keys[order.productId] = productKeys;

      saveKeys(keys);

      await interaction.user.send(`
✅ GIAO DỊCH THÀNH CÔNG

🔑 KEY CỦA BẠN:

${key}
`);

      interaction.reply({
        content: "✅ Đã gửi key vào DM",
        ephemeral: true
      });
    }
  }
});

app.post("/webhook/sepay", (req, res) => {

  const data = req.body;

  const content = data.content || "";

  const orders = loadOrders();

  const order = orders.find(
    x => content.includes(x.orderId)
  );

  if (order) {

    order.paid = true;

    saveOrders(orders);

    console.log(
      "Đã thanh toán:",
      order.orderId
    );
  }

  res.json({
    success: true
  });
});

app.listen(3000, () => {
  console.log("Webhook ONLINE");
});

client.login(config.token);
