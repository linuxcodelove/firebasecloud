const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));

const productsController = require("../controllers/productController");

app.post("/", productsController.createProduct);
app.get("/:id", productsController.getProduct);
app.get("/", productsController.getAllProducts);
app.put("/:id", productsController.updateProduct);
app.delete("/:id", productsController.deleteProduct);

module.exports = app;
