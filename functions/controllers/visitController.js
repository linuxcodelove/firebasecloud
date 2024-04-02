const admin = require("firebase-admin");
const db = admin.firestore().collection("visits");
const json = require("../data/visits");
const { setPayload } = require("../helpers/visits");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");

exports.getAllVisits = async (req, res) => {
  try {
    let response = [];
    const snapshot = await db.get();
    snapshot.forEach((doc) => {
      const obj = setPayload(doc.data());
      const item = {
        ...obj,
      };
      response.push(item);
    });
    return res.status(200).send({
      length: response.length,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching all visits", error);
    return res.status(500).send("An error occurred while Fetching all visits");
  }
};

exports.uploadVisitsJson = async (req, res) => {
  try {
    const promises = json.map(async (item, index) => {
      try {
        const obj = setPayload(item, index + 1);
        await db.doc("/" + obj.id + "/").create(obj);
        return {
          success: true,
          message: `Document with id ${obj.id} created successfully`,
        };
      } catch (error) {
        // If an error occurs during document creation
        console.error(`Error creating document for item:`, item, error);
        return {
          success: false,
          message: `Error creating document for item: ${item}`,
          error: error.message,
        };
      }
    });

    const responses = await Promise.all(promises);
    return res.status(200).json(responses);
  } catch (error) {
    // If an error occurs during the mapping or Promise.all
    console.error("Error uploading customer JSON:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading customer JSON",
      error: error.message,
    });
  }
};

exports.mostVisited = async (req, res) => {
  const { fromDate = null, toDate = null } = req.query;
  try {
    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    let query = db.where(
      Filter.and(
        Filter.where("visit_date_time", ">", startDate),
        Filter.where("visit_date_time", "<", endDate)
      )
    );

    const querySnapshot = await query.get();
    const visitCounts = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const customerId = data.customer_id;
      if (!visitCounts[customerId]) {
        visitCounts[customerId] = {
          visitCount: 0,
          customerName: "",
        };
      }
      visitCounts[customerId].visitCount++;
      visitCounts[customerId].customerName = data.customer_name;
    });

    let mostVisitedCustomer = null;
    let maxVisitCount = 0;
    for (const customerId in visitCounts) {
      if (visitCounts[customerId].visitCount > maxVisitCount) {
        maxVisitCount = visitCounts[customerId].visitCount;
        mostVisitedCustomer = visitCounts[customerId].customerName;
      }
    }

    res.status(200).send({
      mostVisitedCustomer: mostVisitedCustomer,
      maxVisitCount: maxVisitCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error most_visited_in_period");
  }
};

exports.averageAmountSpent = async (req, res) => {
  const { fromDate, toDate } = req.query;
  try {
    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    let query = db.where(
      Filter.and(
        Filter.where("visit_date_time", ">", startDate),
        Filter.where("visit_date_time", "<", endDate)
      )
    );

    const querySnapshot = await query.get();
    let totalAmount = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.amount_paid) {
        totalAmount += data.amount_paid;
      }
    });

    const average = totalAmount / querySnapshot.size;

    res.status(200).send({
      totalAmountSpent: totalAmount,
      average: average.toFixed(2),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error amount_spent_in_period");
  }
};

exports.averageTimeSpent = async (req, res) => {
  const { fromDate, toDate } = req.query;
  try {
    const startDate = formatDate(fromDate);
    const endDate = formatDate(toDate);

    let query = db.where(
      Filter.and(
        Filter.where("visit_date_time", ">", startDate),
        Filter.where("visit_date_time", "<", endDate)
      )
    );

    const querySnapshot = await query.get();
    let totalTimeSpent = 0;
    let totalDocuments = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.time_spend_in_minutes) {
        totalTimeSpent += Number(data.time_spend_in_minutes);
        totalDocuments++;
      }
    });

    const averageTimeSpent =
      totalDocuments > 0 ? totalTimeSpent / totalDocuments : 0;

    res.status(200).send({
      totalTimeSpent: totalTimeSpent,
      averageTimeSpent: Number(averageTimeSpent.toFixed(2)),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error time_spent_in_period");
  }
};

exports.getByFeedback = async (req, res) => {
  const { rating, limit = 10 } = req.query;
  try {
    let baseQuery = db;
    if (rating) {
      baseQuery = baseQuery.where("feedback_rating", "==", parseInt(rating));
    }
    const querySnapshot = await baseQuery
      .limit(+limit)
      .orderBy("feedback_rating", "desc")
      .get();

    let feedbackByRatingCustomers = [];

    querySnapshot.forEach((doc) => {
      const customer = {
        customer_id: doc.id,
        customer_name: doc.data().customer_name,
        visits_count: doc.data().visits_count,
        time_spend_in_minutes: doc.data().time_spend_in_minutes,
        feedback_rating: doc.data().feedback_rating,
      };

      feedbackByRatingCustomers.push(customer);
    });

    return res.status(200).send({
      "Total Customers": feedbackByRatingCustomers.length,
      customers: feedbackByRatingCustomers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.visitedCustomerInCertainPeriod = async (req, res) => {
  const { from_date, to_date, limit = 10 } = req.query;

  if (!from_date || !to_date) {
    return res.status(400).send("from_date and to_date are required.");
  }

  try {
    let baseQuery = db;

    if (from_date && to_date) {
      baseQuery = baseQuery
        .where("visit_date_time", ">=", new Date(from_date))
        .where("visit_date_time", "<=", new Date(to_date));
    }

    const querySnapshot = await baseQuery
      .limit(+limit)
      .orderBy("visit_date_time", "desc")
      .get();

    let sortedCustomers = [];

    querySnapshot.forEach((doc) => {
      const customer = {
        customer_id: doc.id,
        customer_name: doc.data().customer_name,
        time_spend_in_minutes: doc.data().time_spend_in_minutes,
        visit_date_time: new Date(doc.data().visit_date_time._seconds * 1000),
        store_visited: doc.data().store_visited,
      };

      sortedCustomers.push(customer);
    });

    return res.status(200).send({
      "Total Customers": sortedCustomers.length,
      customers: sortedCustomers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getLessVisitedCustomer = async (req, res) => {
  try {
    const querySnapshot = await db
      .orderBy("time_spend_in_minutes", "asc")
      .limit(10)
      .get();

    let lessVisitedCustomers = [];

    querySnapshot.forEach((doc) => {
      const customerData = {
        customer_id: doc.id,
        customer_name: doc.data().customer_name,
        visits_count: doc.data().visits_count,
        time_spend_in_minutes: doc.data().time_spend_in_minutes,
      };

      lessVisitedCustomers.push(customerData);
    });

    return res.status(200).send(lessVisitedCustomers);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getVisitsInCertainDays = async (req, res) => {
  const { from_day, to_day, day } = req.query;

  if (from_day && to_day && day) {
    return res
      .status(400)
      .send(
        "Please provide either 'from_day' and 'to_day' or 'day', not both."
      );
  }
  try {
    let baseQuery = db;

    const querySnapshot = await baseQuery.get();

    let sortedCustomers = [];

    querySnapshot.forEach((doc) => {
      const visitDateTime = new Date(
        doc.data().visit_date_time._seconds * 1000
      );
      const dayOfWeek = visitDateTime.getDay();

      if (day) {
        if (dayOfWeek === getDayIndex(day)) {
          const customer = {
            customer_id: doc.id,
            customer_name: doc.data().customer_name,
            time_spend_in_minutes: doc.data().time_spend_in_minutes,
            visit_date_time: visitDateTime,
            store_visited: doc.data().store_visited,
          };

          sortedCustomers.push(customer);
        }
      } else {
        if (
          from_day &&
          to_day &&
          dayOfWeek >= getDayIndex(from_day) &&
          dayOfWeek <= getDayIndex(to_day)
        ) {
          const customer = {
            customer_id: doc.id,
            customer_name: doc.data().customer_name,
            time_spend_in_minutes: doc.data().time_spend_in_minutes,
            visit_date_time: visitDateTime,
            store_visited: doc.data().store_visited,
          };

          sortedCustomers.push(customer);
        }
      }
    });

    return res.status(200).send({
      "Total Customers": sortedCustomers.length,
      customers: sortedCustomers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getDayIndex = (dayName) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days.findIndex((d) => d === dayName.toLowerCase());
};

// exports.getVisitById = async((req, res) => {});
