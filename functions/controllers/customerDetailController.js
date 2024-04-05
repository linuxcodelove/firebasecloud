const admin = require("firebase-admin");
const db = admin.firestore().collection("customer_details");
const json = require("../data3/customer_details");
const { setPayload } = require("../helpers/customer");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");

exports.getAllCustomerDetail = async (req, res) => {
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
    console.error("Error fetching all products", error);
    return res
      .status(500)
      .send("An error occurred while Fetching all products");
  }
};

exports.createCustomerDetail = async (req, res) => {
  try {
    const obj = setPayload(req.body);
    await db.doc("/" + req.body.id + "/").create(obj);
    res.status(200).send("Done");
  } catch (error) {
    console.error("Error customer details:", error);
    res
      .status(500)
      .send("An error occurred while creating the customer details");
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const customerDetail = await db.doc(req.params.id).get();
    let response = customerDetail.data();
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error Fetching Customer detail:", error);
    return res.status(500).send("An error occurred while Customer detail");
  }
};

exports.uploadCustomerJson = async (req, res) => {
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

exports.getCustomerByMostVisit = async (req, res) => {
  try {
    const query = db.orderBy("visits_count", "desc").limit(1);
    const snapshot = await query.get();
    if (snapshot.empty) return res.status(200).send("No Visits Found!");
    const maxCount = snapshot.docs[0].data().visits_count;
    const mostVisitedSnapshots = await db
      .where("visits_count", "==", maxCount)
      .get();
    const mostVisitedPersons = mostVisitedSnapshots.docs.map((doc) =>
      doc.data()
    );
    return res.status(200).json({
      length: mostVisitedPersons.length,
      data: mostVisitedPersons,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getCustomerByVisitPeriod = async (req, res) => {
  const fieldName = "last_visited_date";
  const { from_date, to_date } = req.query;
  const obj = {
    fromDate: {
      symbol: ">=",
      value: formatDate(from_date) || null,
    },
    toDate: {
      symbol: "<=",
      value: formatDate(to_date) || null,
    },
  };

  const query = formSimpleQuery(fieldName, obj, db);
  fetchData(query, res);
};

exports.getNotVisitedCustomer = async (req, res) => {
  const fieldName = "last_visited_date";
  const { from_date, to_date } = req.query;
  let query;
  if (from_date && to_date) {
    query = db.where(
      Filter.or(
        Filter.where("last_visited_date", "<", formatDate(from_date)),
        Filter.where("last_visited_date", ">", formatDate(to_date))
      )
    );
  } else {
    const obj = {
      fromDate: {
        symbol: "<",
        value: formatDate(from_date) || null,
      },
      toDate: {
        symbol: ">",
        value: formatDate(to_date) || null,
      },
    };
    query = formSimpleQuery(fieldName, obj, db);
  }

  fetchData(query, res);
};

exports.getCustomerByAmountRange = async (req, res) => {
  const fieldName = "total_spent";
  const { start, end } = req.query;
  const obj = {
    start: {
      symbol: ">=",
      value: Number(start) || null,
    },
    end: {
      symbol: "<=",
      value: Number(end) || null,
    },
  };
  const query = formSimpleQuery(fieldName, obj, db);
  fetchData(query, res);
};

exports.getCustomerByAverageSpent = async (req, res) => {
  let query = db;
  try {
    const querySnapshot = await query.get();
    const customersList = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      averageSpent: parseFloat(
        (doc.data().total_spent / doc.data().visits_count).toFixed(2)
      ),
    }));

    return res.status(200).json({
      length: customersList.length,
      data: customersList,
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return res.status(500).json({ error: "Failed to get documents" });
  }
};

exports.getGenderCount = async (req, res) => {
  try {
    const querySnapshot = await db.get();

    // Initialize counts object to store the count for each gender category
    const genderCounts = {
      male: 0,
      female: 0,
      not_specified: 0,
    };

    querySnapshot.forEach((doc) => {
      const gender = doc.data().gender;
      if (gender === "male") {
        genderCounts.male++;
      } else if (gender === "female") {
        genderCounts.female++;
      } else {
        genderCounts.other++;
      }
    });

    return res.status(200).json(genderCounts);
  } catch (error) {
    console.error("Error getting documents:", error);
    return res.status(500).json({ error: "Failed to get documents" });
  }
};

exports.getNotVisitedHighSpent = async (req, res) => {
  const obj1 = {
    start: {
      symbol: ">=",
      value: Number(req.query.start) || null,
    },
  };
  let query;
  query = formSimpleQuery("total_spent", obj1, db);

  const obj2 = {
    fromDate: {
      symbol: "<",
      value: formatDate(req.query.from_date) || null,
    },
  };
  query = formSimpleQuery("last_visited_date", obj2, db);

  fetchData(query, res);
};

exports.getNewRepeatedCustomers = async (req, res) => {
  // we could use last created date to find new customers
  const fieldName = "created_at";
  const { from_date, to_date } = req.query;

  const obj = {
    fromDate: {
      symbol: ">=",
      value: formatDate(from_date) || null,
    },
    toDate: {
      symbol: "<=",
      value: formatDate(to_date) || null,
    },
  };

  let query = db.orderBy("visits_count", "desc");
  query = formSimpleQuery(fieldName, obj, db);

  fetchData(query, res);
};

exports.getCustomersByTopVisitedLocation = async (req, res) => {
  let query = db.orderBy("visits_count", "desc");
  fetchData(query, res);
};

exports.getCustomerFeedback = async (req, res) => {
  const db = admin.firestore().collection("visits");
  let query = db;
  const customer = req.query.customer_id;
  if (customer) query = query.where("customer_id", "==", Number(customer));
  try {
    const querySnapshot = await query.get();
    if (querySnapshot.empty) return res.status(200).send("No Visits Found!");

    // Initialize variables for minimum, maximum, and total feedback
    let minFeedback = null;
    let maxFeedback = null;
    let totalFeedback = null;
    let count = 0;

    // Calculate minimum, maximum, and total feedback
    querySnapshot.forEach((doc) => {
      const feedback = doc.data().feedback_rating;
      if (feedback) {
        minFeedback = minFeedback ? Math.min(minFeedback, feedback) : feedback;
        maxFeedback = maxFeedback ? Math.max(maxFeedback, feedback) : feedback;
        totalFeedback += feedback;
      }
      count++;
    });

    // Calculate average feedback
    const averageFeedback = totalFeedback ? totalFeedback / count : null;

    // Return the statistics as JSON response
    return res.status(200).json({
      minFeedback,
      maxFeedback,
      averageFeedback,
      totalVisits: count,
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return res.status(500).json({ error: "Failed to get documents" });
  }
};

const fetchData = async (query, res) => {
  try {
    const querySnapshots = await query.get();
    const response = querySnapshots.docs.map((doc) => doc.data());
    return res.status(200).json({
      length: response.length,
      data: response,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};
