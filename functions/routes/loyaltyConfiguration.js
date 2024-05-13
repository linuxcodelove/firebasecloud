const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));
const loyaltyController = require("../controllers/loyaltyConfiguration");

app.post("/", loyaltyController.uploadloyaltyConfigJson);
app.get("/", loyaltyController.getLoyalty);
app.get("/redemption_amount", loyaltyController.redemption_amount)

module.exports = app;
