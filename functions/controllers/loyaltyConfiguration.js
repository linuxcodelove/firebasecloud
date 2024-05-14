const admin = require("firebase-admin");
const db = admin.firestore().collection("loyalty_configuration");
const customerdb = admin.firestore().collection("customer_details");
const json = require("../data3/loyalty_configuration");
const { setPayload } = require("../helpers/loyalty_configuration");
const { formatDate, formSimpleQuery } = require("../helpers/common");
const { Filter } = require("firebase-admin/firestore");
const { customers } = require("../controllers/customerDetailController");
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

async function getCustomer(id) {
  const customerDetail = await customerdb.doc(id).get();
  let response = customerDetail.data();
  return response;
}
async function updateCustomerLoyalty(customer_id, remaining_loyalty_points) {
  try {
    const customerRef = customerdb.doc(customer_id);
    await customerRef.update({
      total_loyalty_points: remaining_loyalty_points,
    });
    console.log("Customer loyalty points updated successfully");
  } catch (error) {
    console.error("Error updating customer loyalty points:", error);
    throw error;
  }
}

exports.redemption_amount = async (req, res) => {
  const { customer_id, amount, points_to_redeem } = req.query;
  const customer = await getCustomer(customer_id);
  try {
    const loyaltyConfigResponse = await getLoyaltyData(req, res);
    const { data: loyaltyConfig } = loyaltyConfigResponse;
    const pointPerRupee = loyaltyConfig.data[0].rupee_per_point;
    const redeemed_amount = points_to_redeem * pointPerRupee;
    const amount_to_pay = amount - redeemed_amount;
    customer_redemption = customer.total_loyalty_points - points_to_redeem;
    total_amount_loyalty =
      amount_to_pay * loyaltyConfig.data[0].point_per_rupee;
    remaining_loyalty_points = customer_redemption + total_amount_loyalty;
    console.log(remaining_loyalty_points);
    await updateCustomerLoyalty(customer_id, remaining_loyalty_points);
    return res.status(200).send({
      redeemed_amount,
      amount_to_pay,
      remaining_loyalty_points,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};
