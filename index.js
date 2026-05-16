const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("SePay Webhook Running");
});

app.post("/webhook/sepay", (req, res) => {
  console.log("SEPAY DATA:", req.body);

  res.status(200).json({
    success: true
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
