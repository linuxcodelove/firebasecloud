const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));

const customerDetailController = require("../controllers/customerDetailController.js");

// app.post("/", customerDetailController.createCustomerDetail);
app.get(
  "/customersByVisitedDate",
  customerDetailController.getCustomerByVisitPeriod
);
app.get("/notVisitedCustomer", customerDetailController.getNotVisitedCustomer);
app.get("/most_visited", customerDetailController.getCustomerByMostVisit);
app.get(
  "/customerByAmountSpent",
  customerDetailController.getCustomerByAmountRange
);
app.get(
  "/customerByAverageSpent",
  customerDetailController.getCustomerByAverageSpent
);
app.get(
  "/notVisitedHighSpent",
  customerDetailController.getNotVisitedHighSpent
);
app.get(
  "/newRepeatedCustomers",
  customerDetailController.getNewRepeatedCustomers
);
app.get(
  "/customersByTopVisitedLocation",
  customerDetailController.getCustomersByTopVisitedLocation
);
app.get("/feedback", customerDetailController.getCustomerFeedback);
app.get("/countByGender", customerDetailController.getGenderCount);
app.get("/customerByMobile", customerDetailController.getCustomerByMobile);
app.post("/", customerDetailController.createCustomerDetail);
app.post("/json", customerDetailController.uploadCustomerJson);
app.get("/:id", customerDetailController.getCustomerDetail);
app.get("/", customerDetailController.getAllCustomerDetail);

module.exports = app;
