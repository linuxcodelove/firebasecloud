const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));

const saleController = require("../controllers/saleController");

app.post("/", saleController.createSale);
module.exports = app;
