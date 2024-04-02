const admin = require("firebase-admin");
const db = admin.firestore().collection("visit_items");
const json = require("../data/visit_items");
const { setPayload } = require("../helpers/visitItems");
const { formatDate } = require("../helpers/common");

exports.getAllVisitItems = async (req, res) => {
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

exports.uploadVisitItemsJson = async (req, res) => {
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

exports.getMostOrderedItems = async (req, res) => {
  const { customer, count = 0, from_date = null, to_date = null } = req.query;

  try {
    let groupedItem = {};
    let itemList = [];
    let query = db;

    if (customer) query = query.where("customer_id", "==", Number(customer));
    if (from_date)
      query = query.where(
        "visits.visit_date_time",
        ">=",
        formatDate(from_date)
      );
    if (to_date)
      query = query.where("visits.visit_date_time", "<=", formatDate(to_date));

    const snapshots = await query.get();
    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push(data);
      if (groupedItem.hasOwnProperty(data.item_id))
        groupedItem[data.item_id].count += 1;
      else
        groupedItem[data.item_id] = {
          data: data,
          count: 1,
        };
    });

    let mostFrequentItemId;

    mostFrequentItemId = findMostFrequentItems(groupedItem, count);
    const result = mostFrequentItemId.map((item) => ({
      id: item.data.id,
      item_name: item.data.item_name,
      count: item.count,
    }));
    res.status(200).json({
      length: result.length,
      result,
    });
  } catch (error) {
    console.error("Error fetching all products", error);
    return res
      .status(500)
      .send("An error occurred while Fetching all products");
  }
};

exports.getOrdersBySpecialOffers = async (req, res) => {
  const { sp_offer } = req.query;
  try {
    let query = db;
    const itemList = [];
    if (sp_offer)
      query = query.where("special_offer", "==", sp_offer.toLowerCase());

    const snapshots = await query.get();
    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push(data.visits);
    });
    return res.status(200).json({
      length: itemList.length,
      itemList,
    });
  } catch (error) {
    console.error("Error fetching Orders based on special offers", error);
    return res
      .status(500)
      .send("An error occurred while Fetching orders based on special offers");
  }
};

exports.getOrdersByPrice = async (req, res) => {
  const { min, max } = req.query;
  try {
    let query = db;
    const itemList = [];
    if (min) query = query.where("visits.amount", ">=", Number(min));
    if (max) query = query.where("visits.amount", "<=", Number(max));

    const snapshots = await query.get();
    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push(data.visits);
    });
    return res.status(200).json({
      length: itemList.length,
      itemList,
    });
  } catch (error) {
    console.error("Error fetching Orders based on price range", error);
    return res
      .status(500)
      .send("An error occurred while Fetching orders based on price range");
  }
};

exports.getByDietaryPreference = async (req, res) => {
  const { food_type, limit = 10 } = req.query;

  try {
    let baseQuery = db;
    if (food_type) {
      baseQuery = baseQuery.where("veg_or_non_veg", "==", food_type);
    }
    const querySnapshot = await baseQuery.limit(+limit).get();

    let dietary_customers = [];

    querySnapshot.forEach((doc) => {
      const customer = {
        customer_id: doc.id,
        customer_name: doc.data().customer_name,
        visits_count: doc.data().visits_count,
        time_spend_in_minutes: doc.data().time_spend_in_minutes,
        veg_or_non_veg: doc.data().veg_or_non_veg,
      };

      dietary_customers.push(customer);
    });

    return res.status(200).send({
      "Total Customers": dietary_customers.length,
      customers: dietary_customers,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const findMostFrequentItems = (obj, n) => {
  let mostFrequentItemId = [];
  for (const itemId in obj) {
    const count = obj[itemId].count;
    if (count > Number(n)) mostFrequentItemId.push(obj[itemId]);
  }
  return mostFrequentItemId;
};

// const findMostFrequent = (obj) => {
//   let mostFrequentItemId = null;
//   let highestCount = 0;
//   for (const itemId in obj) {
//     const count = obj[itemId];
//     if (count > highestCount) {
//       mostFrequentItemId = itemId;
//       highestCount = count;
//     }
//   }
//   return { id: Number(mostFrequentItemId), num: highestCount };
// };
