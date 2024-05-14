const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));

const offerController = require("../controllers/offerController.js");

app.post("/", offerController.uploadoffersJson);
app.get("/", offerController.getOffers);

module.exports = app;
