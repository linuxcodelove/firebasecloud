const admin = require("firebase-admin");
const db = admin.firestore().collection("offers");
const json = require("../data3/offers");
const { setPayload } = require("../helpers/offers");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");

exports.uploadoffersJson = async (req, res) => {
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

exports.getOffers = async (req, res) => {
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
      data: response,
    });
  } catch (error) {
    console.error("Error fetching the offer", error);
    return res.status(500).send("An error occurred while fetching the offers");
  }
};

exports.getAllOffers = async (req, res) => {
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
    return response;
  } catch (error) {
    console.error("Error fetching the offer", error);
    return res.status(500).send("An error occurred while fetching the offers");
  }
};
