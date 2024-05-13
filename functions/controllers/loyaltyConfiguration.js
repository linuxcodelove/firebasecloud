const admin = require("firebase-admin");
const db = admin.firestore().collection("loyalty_configuration");
const json = require("../data3/loyalty_configuration");
const { setPayload } = require("../helpers/loyalty_configuration");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");

exports.uploadloyaltyConfigJson = async (req, res) => {
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

exports.getLoyalty = async (req, res) => {
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
    console.error("Error fetching the configuration", error);
    return res
      .status(500)
      .send("An error occurred while fetching the configuration");
  }
};

async function getLoyaltyData() {
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
    return {
      status: 200,
      data: {
        length: response.length,
        data: response,
      },
    };
  } catch (error) {
    console.error("Error fetching the configuration", error);
    return {
      status: 500,
      error: "An error occurred while fetching the configuration",
    };
  }
}

exports.redemption_amount = async (req, res) => {
  const { amount, points_to_redeem } = req.query;

  try {
    const loyaltyConfigResponse = await getLoyaltyData(req, res);
    const { data: loyaltyConfig } = loyaltyConfigResponse;
    const pointPerRupee = loyaltyConfig.data[0].rupee_per_point;
    const redeemed_amount = points_to_redeem * pointPerRupee;
    console.log(redeemed_amount);
    const amount_to_pay = amount - redeemed_amount;
    return res.status(200).send({
      redeemed_amount,
      amount_to_pay,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};
