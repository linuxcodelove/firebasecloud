const admin = require("firebase-admin");
const db = admin.firestore().collection("loyalty_configuration");
const customerdb = admin.firestore().collection("customer_details");
const json = require("../data3/loyalty_configuration");
const { setPayload } = require("../helpers/loyalty_configuration");
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

exports.getLoyaltyConfig = async (cb) => {
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
    return cb(response);
  } catch (error) {
    return "create Loyalty config failed";
  }
};

exports.getLoyalty = async (req, res) => {
  try {
    await this.getLoyaltyConfig((response) => {
      return res.status(200).send({
        length: response.length,
        data: response,
      });
    });
  } catch (error) {
    return res
      .status(500)
      .send("An error occurred while fetching the configuration");
  }
};

async function getCustomer(customer_id) {
  try {
    const query = customerdb.where("customer_id", "==", Number(customer_id));
    const querySnapshot = await query.get();
    if (querySnapshot.empty) {
      return null;
    } else {
      return querySnapshot.docs[0].data();
    }
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }
}
async function updateCustomerLoyalty(customer_id, remaining_loyalty_points) {
  try {
    const query = customerdb.where("customer_id", "==", Number(customer_id));
    const querySnapshot = await query.get();
    const customerRef = querySnapshot.docs[0].ref;
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
    const loyaltyConfigResponse = await this.getLoyalty(req, res);
    const { data: loyaltyConfig } = loyaltyConfigResponse;
    const pointPerRupee = loyaltyConfig.data[0].rupee_per_point;
    const redeemed_amount = Math.floor(points_to_redeem * pointPerRupee);
    const amount_to_pay = amount - redeemed_amount;
    const customer_redemption =
      customer.total_loyalty_points - points_to_redeem;
    const current_payment_loyalty = Math.floor(
      amount_to_pay * loyaltyConfig.data[0].point_per_rupee
    );
    const remaining_loyalty_points = Math.floor(
      customer_redemption + current_payment_loyalty
    );
    await updateCustomerLoyalty(customer_id, remaining_loyalty_points);
    return res.status(200).send({
      redeemed_amount,
      amount_to_pay,
      current_payment_loyalty,
      remaining_loyalty_points,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};
