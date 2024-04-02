const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));
const visitItemsController = require("../controllers/visitItemsController.js");

app.get("/most_ordered", visitItemsController.getMostOrderedItems);

app.get("/special_offers", visitItemsController.getOrdersBySpecialOffers);
app.get("/orders_by_price", visitItemsController.getOrdersByPrice);
app.get("/dietary_preference", visitItemsController.getByDietaryPreference);

app.post("/", visitItemsController.uploadVisitItemsJson);

app.get("/", visitItemsController.getAllVisitItems);

module.exports = app;
