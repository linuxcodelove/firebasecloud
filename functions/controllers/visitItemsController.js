const admin = require("firebase-admin");
const db = admin.firestore().collection("visit_items");
const json = require("../data3/visit_items");
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
    return res.status(200).send(response);
  } catch (error) {
    return res.status(500).send(error);
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
    return res.status(500).send(error);
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
        groupedItem[data.item_id].quantity += 1;
      else
        groupedItem[data.item_id] = {
          ...data,
          quantity: 1,
          item_price_in_rupees: parseFloat(data.item_price / 100).toFixed(2),
        };
    });

    let result;

    result = findMostFrequentItems(groupedItem, count);

    res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error);
  }
};

const findMostFrequentItems = (obj, n) => {
  let mostFrequentItemId = [];
  for (const itemId in obj) {
    const count = obj[itemId].quantity;
    if (count > Number(n)) mostFrequentItemId.push(obj[itemId]);
  }
  return mostFrequentItemId;
};

exports.getOrdersBySpecialOffers = async (req, res) => {
  const { sp_offer } = req.query;
  try {
    let query = db;
    const itemList = [];
    if (sp_offer) query = query.where("special_offer", "==", sp_offer);

    const snapshots = await query.get();
    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push({
        ...data,
        item_price_in_rupees: parseFloat(data.item_price / 100).toFixed(2),
      });
    });
    return res.status(200).json(itemList);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getOrdersByPrice = async (req, res) => {
  const { min, max } = req.query;
  try {
    let query = db;
    const itemList = [];
    if (min) query = query.where("item_price", ">=", Number(min));
    if (max) query = query.where("item_price", "<=", Number(max));

    const snapshots = await query.get();
    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push({
        ...data,
        item_price_in_rupees: parseFloat(data.item_price / 100).toFixed(2),
      });
    });
    return res.status(200).json(itemList);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getByDietaryPreference = async (req, res) => {
  const { food_type } = req.query;

  try {
    let query = db;
    const itemList = [];
    if (food_type) {
      query = query.where("veg_or_non_veg", "==", food_type);
    }
    const snapshots = await query.get();

    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push({
        ...data,
        item_price_in_rupees: parseFloat(data.item_price / 100).toFixed(2),
      });
    });

    return res.status(200).json(itemList);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getSeasonalItems = async (req, res) => {
  const { seasonal } = req.query;

  try {
    let query = db;
    const itemList = [];
    if (seasonal) {
      query = query.where("seasonal", "==", seasonal);
    }
    const snapshots = await query.get();

    snapshots.forEach((doc) => {
      const data = doc.data();
      itemList.push({
        ...data,
        item_price_in_rupees: parseFloat(data.item_price / 100).toFixed(2),
      });
    });

    return res.status(200).json(itemList);
  } catch (error) {
    return res.status(500).send(error);
  }
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
