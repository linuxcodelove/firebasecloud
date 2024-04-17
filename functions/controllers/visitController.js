const admin = require("firebase-admin");
const db = admin.firestore().collection("visits");
const json = require("../data3/visits");
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
      visitCounts[customerId].data = data;
    });

    let mostVisitedCustomer = null;
    let maxVisitCount = 0;
    for (const customerId in visitCounts) {
      if (visitCounts[customerId].visitCount > maxVisitCount) {
        maxVisitCount = visitCounts[customerId].visitCount;
        mostVisitedCustomer = visitCounts[customerId].data;
      }
    }
    mostVisitedCustomer.visitCount = maxVisitCount;

    res.status(200).send({
      data: mostVisitedCustomer,
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
    const spentAmount = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const customerId = data.customer_id;
      if (!spentAmount[customerId]) {
        spentAmount[customerId] = {
          totalAmount: 0,
          average: 0,
          customerName: "",
          visitCount: 0,
          ...data,
        };
      }
      spentAmount[customerId].totalAmount += data.amount_paid;
      spentAmount[customerId].visitCount++;
      spentAmount[customerId].average =
        spentAmount[customerId].totalAmount /
        spentAmount[customerId].visitCount;
      spentAmount[customerId].customerName = data.customer_name;
    });
    res.status(200).send({
      data: Object.values(spentAmount),
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
    const spentTime = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const customerId = data.customer_id;
      if (!spentTime[customerId]) {
        spentTime[customerId] = {
          totalTimeSpentInMinutes: 0,
          averageMinutes: 0,
          customerName: "",
          visitCount: 0,
          ...data,
        };
      }
      spentTime[customerId].totalTimeSpentInMinutes +=
        data.time_spend_in_minutes;
      spentTime[customerId].visitCount++;
      spentTime[customerId].averageMinutes =
        spentTime[customerId].totalTimeSpentInMinutes /
        spentTime[customerId].visitCount;
      spentTime[customerId].customerName = data.customer_name;
    });

    res.status(200).send({
      data: Object.values(spentTime),
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
      feedbackByRatingCustomers.push(doc.data());
    });

    return res.status(200).send({
      data: feedbackByRatingCustomers,
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
        .where("visit_date_time", ">=", formatDate(from_date))
        .where("visit_date_time", "<=", formatDate(to_date));
    }

    const querySnapshot = await baseQuery
      .limit(+limit)
      .orderBy("visit_date_time", "desc")
      .get();

    let sortedCustomers = [];

    querySnapshot.forEach((doc) => {
      sortedCustomers.push(doc.data());
    });

    return res.status(200).send({
      data: sortedCustomers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getLessVisitedCustomer = async (req, res) => {
  const { limit = 10, visits_count: target = 1 } = req.query;

  try {
    let groupedItem = {};
    const querySnapshot = await db.get();
    // querySnapshot.forEach((doc) => {
    //   const data = doc.data();
    //   if (groupedItem.hasOwnProperty(data.customer_id))
    //     groupedItem[data.customer_id].count += 1;
    //   else
    //     groupedItem[data.customer_id] = {
    //       name: data.customer_name,
    //       count: 1,
    //     };
    // });

    // let filteredCustomers = [];
    // for (const item of Object.keys(groupedItem)) {
    //   const count = groupedItem[item].count;
    //   if (count <= Number(target)) {
    //     console.log(groupedItem[item]);
    //     filteredCustomers.push({
    //       customer_id: item,
    //       customer_name: groupedItem[item].name,
    //       visits_count: count,
    //     });
    //   }
    // }

    const visitCounts = {};
    const targetVisitsCount = target ? target : 1;
    querySnapshot.forEach((doc) => {
      const customerId = doc.data().customer_id;
      visitCounts[customerId] = visitCounts[customerId] || { visitsCount: 0 };
      visitCounts[customerId].visitsCount++;
      visitCounts[customerId].customer_name = doc.data().customer_name;
      visitCounts[customerId].mobile_number = doc.data().mobile_number;
      visitCounts[customerId].service_type = doc.data().service_type;
      visitCounts[customerId].store_visited = doc.data().store_visited;
      visitCounts[customerId].visit_date_time = doc.data().visit_date_time;
      visitCounts[customerId].feedback_rating = doc.data().feedback_rating;
      visitCounts[customerId].time_spend_in_minutes =
        doc.data().time_spend_in_minutes;
    });

    // Count the occurrences of each customer and store the entire doc.data() object
    const filteredCustomers = Object.entries(visitCounts)
      .filter(([customerId, data]) => {
        console.log(customerId);
        if (targetVisitsCount === null) {
          return true; // Include all customers if no visits_count is provided
        }
        return data.visitsCount <= targetVisitsCount;
      })
      .map(([customerId, data]) => ({
        customer_id: customerId,
        customer_name: data.customer_name,
        mobile_number: data.mobile_number,
        service_type: data.service_type,
        store_visited: data.store_visited,
        visit_date_time: data.visit_date_time,
        feedback_rating: data.feedback_rating,
        time_spend_in_minutes: data.time_spend_in_minutes,
        visitCount: data.visitsCount,
      }));

    // Sort customers by visits_count in ascending order and set limit
    const limitedCustomers = filteredCustomers
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, +limit);

    return res.status(200).send({
      data: limitedCustomers,
    });
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
          sortedCustomers.push(doc.data());
        }
      } else {
        if (
          from_day &&
          to_day &&
          dayOfWeek >= getDayIndex(from_day) &&
          dayOfWeek <= getDayIndex(to_day)
        ) {
          sortedCustomers.push(doc.data());
        }
      }
    });

    return res.status(200).send({
      data: sortedCustomers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getVisitsInCertainDaysFiltered = async (req, res) => {
  const { day } = req.query;

  try {
    let baseQuery = db;

    const querySnapshot = await baseQuery.get();

    const totalCustomers = [];
    const selectedDay = day.toLowerCase(); // Convert to lowercase for case-insensitive comparison

    querySnapshot.forEach((doc) => {
      const visitDateTime = new Date(doc.data().visit_date_time.seconds * 1000);
      const dayOfWeek = visitDateTime.getDay();

      if (selectedDay && dayOfWeek === getDayIndex(selectedDay)) {
        // Check if the customer visited only on the selected day
        const customerId = doc.data().customer_id;
        let otherDaysVisited = false;

        // Iterate over all documents except the current one
        querySnapshot.forEach((otherDoc) => {
          if (
            otherDoc.id !== doc.id &&
            otherDoc.data().customer_id === customerId
          ) {
            const otherVisitDateTime = new Date(
              otherDoc.data().visit_date_time.seconds * 1000
            );
            if (otherVisitDateTime.getDay() !== dayOfWeek) {
              otherDaysVisited = true;
            }
          }
        });

        if (!otherDaysVisited) {
          totalCustomers.push(doc.data());
        }
      }
    });

    console.log(totalCustomers);

    return res.status(200).send({
      data: totalCustomers,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal Server Error");
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
