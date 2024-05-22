const admin = require("firebase-admin");
const db = admin.firestore().collection("customer_details");
const jsonData = require("../data4/customer_details");
const { setCustomerPayload } = require("../helpers/customer");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");
const offers = require("../controllers/offerController");
const loyaltyController = require("./loyaltyConfiguration");

exports.getAllCustomerDetail = async (req, res) => {
  try {
    let response = [];
    const snapshot = await db.get();
    snapshot.forEach((doc) => {
      const obj = setCustomerPayload(doc.data());
      const item = {
        ...obj,
      };
      response.push(item);
    });
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createCustomer = async (item, cb) => {
  try {
    const customerDetail = await db.add(item);
    await db.doc(customerDetail.id).update({ ...item, id: customerDetail.id });
    let response = (await customerDetail.get()).data();
    return cb({ ...response, id: customerDetail.id });
  } catch (error) {
    throw new Error("Create customer Failed");
  }
};

exports.createCustomerDetail = async (req, res) => {
  try {
    await this.createCustomer(req.body, (response) => {
      res.status(200).json(response);
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const customerDetail = await db.doc(req.params.id).get();
    let response = customerDetail.data();
    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.uploadCustomerJson = async (req, res) => {
  try {
    const promises = jsonData.map((item) =>
      this.createCustomer(item, (response) => response)
    );
    const responses = await Promise.all(promises);
    return res.status(200).json(responses);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getCustomerByMostVisit = async (req, res) => {
  try {
    const query = db.orderBy("visits_count", "desc").limit(1);
    const snapshot = await query.get();
    if (snapshot.empty) return res.status(200).send([]);
    const maxCount = snapshot.docs[0].data().visits_count;
    const mostVisitedSnapshots = await db
      .where("visits_count", "==", maxCount)
      .get();
    const mostVisitedPersons = mostVisitedSnapshots.docs.map((doc) =>
      doc.data()
    );
    return res.status(200).json(mostVisitedPersons);
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
      average_spent: parseFloat(
        (doc.data().total_spent / doc.data().visits_count).toFixed(2)
      ),
    }));

    return res.status(200).json(customersList);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getGenderCount = async (req, res) => {
  try {
    const querySnapshot = await db.get();

    // Initialize counts object to store the count for each gender category
    const genderCounts = {
      male: 0,
      female: 0,
      notSpecified: 0,
    };

    querySnapshot.forEach((doc) => {
      const gender = doc.data().gender;
      if (gender === "male") {
        genderCounts.male++;
      } else if (gender === "female") {
        genderCounts.female++;
      } else {
        genderCounts.notSpecified++;
      }
    });

    return res.status(200).json(genderCounts);
  } catch (error) {
    return res.status(500).send(error);
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
  query = query.orderBy("total_spent", "desc");

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
  let query;
  query = formSimpleQuery(fieldName, obj, db);
  query = query.orderBy("visits_count", "desc");

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
    if (querySnapshot.empty) return res.status(200).send({});

    // Initialize variables for minimum, maximum, and total feedback
    let minimumFeedback = null;
    let maximumFeedback = null;
    let totalFeedback = null;
    let count = 0;

    // Calculate minimum, maximum, and total feedback
    querySnapshot.forEach((doc) => {
      const feedback = doc.data().feedback_rating;
      if (feedback) {
        minimumFeedback = minimumFeedback
          ? Math.min(minimumFeedback, feedback)
          : feedback;
        maximumFeedback = maximumFeedback
          ? Math.max(maximumFeedback, feedback)
          : feedback;
        totalFeedback += feedback;
      }
      count++;
    });

    // Calculate average feedback
    const averageFeedback = totalFeedback
      ? parseFloat(totalFeedback / count).toFixed(1)
      : null;

    // Return the statistics as JSON response
    return res.status(200).json({
      minimumFeedback,
      maximumFeedback,
      averageFeedback,
      totalVisits: count,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getCustomer = async (mobile_number) => {
  const querySnapshots = await db
    .where("mobile_number", "==", mobile_number)
    .get();

  if (querySnapshots.empty) {
    return false;
  }
  return querySnapshots.docs[0].data();
};

exports.getCustomerByMobile = async (req, res) => {
  try {
    const customer = await this.getCustomer(req.query.mobile_number, res);
    if (!customer) throw new Error("No customer found with this number");
    const allOffers = await offers.getAllOffers();
    customer.available_offers = [];
    // Assign offers that are available for the customer
    allOffers.forEach((offer) => {
      if (!offer.customers || offer.customers.includes(customer.customer_id)) {
        customer.available_offers.push(offer);
      }
    });
    let { min_point_to_redeem, reward_list } =
      await loyaltyController.getLoyaltyConfig((response) => response[0]);
    customer.isCashbackAvailable =
      customer.total_loyalty_points >= min_point_to_redeem;
    customer.availableRewards = reward_list.filter(
      (el) => customer.total_loyalty_points >= el.points
    );
    return res.status(200).json(customer);
  } catch (error) {
    return res.status(400).send(String(error));
  }
};
