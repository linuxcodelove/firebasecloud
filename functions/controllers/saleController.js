const admin = require("firebase-admin");
const db = admin.firestore();

const customerController = require("./customerDetailController");
const loyaltyController = require("./loyaltyConfiguration");
const visitController = require("./visitController");
const visitItemController = require("./visitItemsController");

const customerDb = admin.firestore().collection("customer_details");

const calculateRemainingLoyalty = (
  totalLoyalty,
  pointsRedeemed,
  pointsGained
) => {
  return totalLoyalty - pointsRedeemed + pointsGained;
};

const createCustomerData = (item) => {
  return {
    customer_id: item.customer_id,
    customer_name: item.customer_name,
    gender: item.gender,
    created_at: item.created_at,
    last_visited_date: item.date_time,
    last_visited_store: item.store_id,
    last_spent_amount: item.amount_paid,
    mobile_number: item.mobile_number,
    top_visited_store: null,
    total_spent: item.amount_paid,
    visits_count: 1,
    total_loyalty_points: item.points_gained,
  };
};

const createVisitData = (item, amountPaid) => {
  const {
    id,
    bill_amount,
    customer_id,
    customer_name,
    mobile_number,
    store_id,
    date_time,
    points_gained,
    points_redeemed,
  } = item;

  return {
    id,
    bill_amount,
    amount_paid: amountPaid,
    customer_id,
    customer_name,
    mobile_number,
    store_id,
    date_time,
    points_gained,
    points_redeemed,
  };
};

const updateCustomerData = async (item, customerData, amountToBePaid) => {
  const customerDoc = customerDb.doc("/" + customerData.customer_id + "/");
  const data = {
    last_visited_date: item.date_time,
    last_visited_store_id: item.store_id,
    last_spent_amount: amountToBePaid,
    visits_count: customerData.visits_count + 1,
    total_spent: customerData.total_spent + amountToBePaid,
    total_loyalty_points: calculateRemainingLoyalty(
      customerData.total_loyalty_points,
      item.points_redeemed,
      item.points_gained
    ),
  };
  await customerDoc.update(data);
  const response = (await customerDoc.get()).data();
  return response;
};

exports.createSale = async (req, res) => {
  try {
    const { mobile_number, bill_amount, points_redeemed, items, id } = req.body;

    const loyaltyConfig = await loyaltyController.getLoyaltyConfig(
      (response) => response[0]
    );

    const amountToBePaid =
      bill_amount - points_redeemed * loyaltyConfig.rupee_per_point;

    const customerSnapshot = await customerDb
      .where("mobile_number", "==", mobile_number)
      .get();

    if (customerSnapshot.empty) {
      const customer = createCustomerData(req.body);
      await customerController.createCustomer(customer, () => {});
    } else {
      const customerData = customerSnapshot.docs[0].data();
      await updateCustomerData(req.body, customerData, amountToBePaid);
    }

    const visitData = createVisitData(req.body, amountToBePaid);
    const response = await visitController.createVisit(
      visitData,
      (response) => response
    );

    await visitItemController.uploadVisitsItems(items, id);

    return res.status(200).json(response);
  } catch (error) {
    res.status(500).send(error);
  }
};
