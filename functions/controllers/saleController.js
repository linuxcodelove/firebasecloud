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
    customer_id: item.customer?.customer_id,
    customer_name: item.customer?.customer_name,
    gender: item.customer?.gender,
    created_at: item.date_time,
    last_visited_date: item.date_time,
    last_visited_store: item.store,
    last_spent_amount: item.amount_paid,
    mobile_number: item.mobile_number,
    top_visited_store: null,
    total_spent: item.amount_paid,
    visits_count: 1,
    total_loyalty_points: item.points_gained,
  };
};

const createVisitData = (item) => {
  const {
    id,
    bill_amount,
    amount_paid,
    customer,
    store,
    date_time,
    points_gained,
    points_redeemed,
    loyalty_discount_amount,
    loyalty_type,
    reward,
  } = item;

  return {
    id,
    bill_amount,
    customer,
    amount_paid,
    store,
    date_time,
    points_gained,
    points_redeemed,
    loyalty_discount_amount,
    loyalty_type,
    reward,
  };
};

const updateCustomerData = async (item) => {
  const customerDoc = customerDb.doc("/" + item.customer_id + "/");
  const data = {
    last_visited_date: item.date_time,
    last_visited_store: item.store,
    last_spent_amount: item.amount_paid,
    visits_count: item.visits_count + 1,
    total_spent: item.total_spent + item.amount_paid,
    total_loyalty_points: calculateRemainingLoyalty(
      item.total_loyalty_points,
      item.points_redeemed,
      item.points_gained
    ),
  };
  await customerDoc.update(data);
  const response = (await customerDoc.get()).data();
  return response;
};

const calculateDiscountAmount = (
  { discount_percentage, max_discount, discount_amount, free_item },
  bill_amount
) => {
  if (discount_percentage) {
    const discountAmount = bill_amount * (discount_percentage / 100);
    return discountAmount >= max_discount ? max_discount : discountAmount;
  } else if (free_item) return 0;
  return bill_amount >= discount_amount ? discount_amount : bill_amount;
};

exports.createSale = async (req, res) => {
  try {
    let {
      id,
      mobile_number,
      bill_amount,
      amount_paid,
      points_redeemed,
      items,
      loyalty_type,
      reward_id,
    } = req.body;

    let { min_point_to_redeem, point_per_rupee, rupee_per_point, reward_list } =
      await loyaltyController.getLoyaltyConfig((response) => response[0]);

    const customerSnapshot = await customerDb
      .where("mobile_number", "==", mobile_number)
      .get();

    let loyalty_discount_amount = 0;
    let points_gained = Math.floor(amount_paid * point_per_rupee);
    let reward = null;

    if (customerSnapshot.empty) {
      const customer = createCustomerData({ ...req.body, points_gained });
      customerController.createCustomer(customer, () => {});
    } else {
      const customerData = customerSnapshot.docs[0].data();

      if (
        customerData.total_loyalty_points < points_redeemed ||
        (points_redeemed &&
          customerData.total_loyalty_points < min_point_to_redeem)
      )
        throw new Error("Customer dont have enough loyalty points to redeem!");

      if (loyalty_type == "C") {
        loyalty_discount_amount = points_redeemed * rupee_per_point;
      } else if (loyalty_type == "R") {
        reward = reward_list.find((item) => item.id == reward_id);
        if (points_redeemed < reward.points)
          throw new Error(
            `This reward requires ${reward.points} loyalty points to redeem!`
          );
        loyalty_discount_amount = calculateDiscountAmount(reward, bill_amount);
      }
      updateCustomerData({ ...req.body, ...customerData, points_gained });
    }

    const visitData = createVisitData({
      ...req.body,
      loyalty_discount_amount,
      points_gained,
      points_redeemed,
      reward,
    });
    const response = await visitController.createVisit(
      visitData,
      (response) => response
    );
    await visitItemController.uploadVisitsItems(items, id);
    return res.status(200).json(response);
  } catch (error) {
    res.status(500).send(String(error));
  }
};
