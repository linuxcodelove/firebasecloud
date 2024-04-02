const admin = require("firebase-admin");
const db = admin.firestore();

exports.getAllProducts = async (req, res) => {
  try {
    let response = [];
    const snapshot = await db.collection("products").get();
    snapshot.forEach((doc) => {
      const item = {
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        price: doc.data().price,
      };
      response.push(item);
    });
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error fetching all products", error);
    return res
      .status(500)
      .send("An error occurred while Fetching all products");
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { id, name, description, price } = req.body;
    await db
      .collection("products")
      .doc("/" + id + "/")
      .create({
        name: name,
        description: description,
        price: price,
      });
    res.status(200).send("Done");
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("An error occurred while creating the product");
  }
};
exports.getProduct = async (req, res) => {
  try {
    const product = await db.collection("products").doc(req.params.id).get();
    let response = product.data();
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error Fetching product:", error);
    return res.status(500).send("An error occurred while Fetching product");
  }
};
exports.updateProduct = async (req, res) => {
  try {
    console.log(req.body, "bodyyyyyyyy");
    const { id, name, description, price } = req.body;
    const product = await db.collection("products").doc(req.params.id);
    const response = await product.update({
      id,
      name,
      description,
      price,
    });
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("An error occurred while updating the product");
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const product = await db.collection("products").doc(req.params.id);
    await product.delete();
    return res.status(200).send("Product deleted successfully");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("An error occurred while deleting the product");
  }
};
