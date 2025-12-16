import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import axios from "axios";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* =========================
   CREATE ORDER
========================= */
app.post("/create-order", (req, res) => {
  const orderId = "ORD" + Date.now();
  const amount = req.body.amount;

  const raw =
    process.env.PAYWAY_MERCHANT_ID +
    orderId +
    amount +
    "USD";

  const hash = crypto
    .createHmac("sha512", process.env.PAYWAY_API_KEY)
    .update(raw)
    .digest("hex");

  res.json({
    merchant_id: process.env.PAYWAY_MERCHANT_ID,
    tran_id: orderId,
    amount: amount,
    currency: "USD",
    return_url: process.env.RETURN_URL,
    ipn_url: process.env.IPN_URL,
    hash: hash
  });
});

/* =========================
   IPN FROM ABA
========================= */
app.post("/ipn", async (req, res) => {
  const data = req.body;

  if (data.status === "SUCCESS") {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text:
`✅ ABA PAYMENT SUCCESS

Order ID: ${data.tran_id}
Amount: $${data.amount}
Status: ${data.status}`
      }
    );
  }

  res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
