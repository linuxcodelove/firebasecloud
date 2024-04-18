/* eslint-disable quotes */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));

const customerDetailRoutes = require("./routes/customerDetail.js");
const productRoutes = require("./routes/product.js");
const visitItemRoutes = require("./routes/visitItems.js");
const visitRoutes = require("./routes/visits.js");

app.use((req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) return res.status(401).send("Unauthorized");
  const token = authToken?.split("Bearer ")[1];
  admin
    .auth()
    .verifyIdToken(token)
    .then(() => {
      console.log("success");
      next();
    })
    .catch(() => {
      console.log("error");
      return res.status(401).send("Unauthorized");
    });
});

app.use("/products", productRoutes);
app.use("/customer_details", customerDetailRoutes);
app.use("/visit_items", visitItemRoutes);
app.use("/visits", visitRoutes);

// Export the api to Firebase cloud funtions
exports.app = functions.https.onRequest(app);
