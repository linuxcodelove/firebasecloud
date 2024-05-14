const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({ origin: true }));
const visitsController = require("../controllers/visitController");

app.post("/storeData", visitsController.createVisit);
app.post("/", visitsController.uploadVisitsJson);
app.get("/mostVisit", visitsController.mostVisited);
app.get("/amountSpent", visitsController.averageAmountSpent);
app.get("/timeSpent", visitsController.averageTimeSpent);
app.get("/feedback", visitsController.getByFeedback);

app.get("/lessVisitedCustomer", visitsController.getLessVisitedCustomer);
app.get(
  "/visitsInCertainPeriod",
  visitsController.visitedCustomerInCertainPeriod
);

app.get("/visitsInCertainDays", visitsController.getVisitsInCertainDays);
app.get(
  "/visitsInParticularDays",
  visitsController.getVisitsInCertainDaysFiltered
);

app.get("/", visitsController.getAllVisits);

module.exports = app;
