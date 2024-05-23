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
    customer_name: item.customer?.customer_name,
    gender: item.customer?.gender,
    mobile_number: item.mobile_number,
    created_at: item.date_time,
    last_visited_date: item.date_time,
    last_visited_store: item.store,
    last_spent_amount: item.amount_paid,
    top_visited_store: null,
    total_spent: item.amount_paid,
    visits_count: 1,
    total_loyalty_points: item.points_gained,
  };
};

const createVisitData = (item) => {
  const {
    bill_amount,
    amount_paid,
    customerData,
    store,
    date_time,
    points_gained,
    points_redeemed,
    loyalty_discount_amount = 0,
    loyalty_type = null,
    reward = null,
  } = item;

  return {
    bill_amount,
    customer: customerData,
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
  try {
    const customerDoc = customerDb.doc("/" + item.id + "/");
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
      last_visited_items: item.items,
    };
    await customerDoc.update(data);
    const response = (await customerDoc.get()).data();
    return response;
  } catch (error) {
    throw new Error("Update customer failed", error);
  }
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

const getCustomerAndLoyaltyConfig = async (mobile_number) => {
  try {
    const req1 = customerController.getCustomer(mobile_number, (res) => res);
    const req2 = loyaltyController.getLoyaltyConfig((response) => response[0]);
    const promises = [req1, req2];
    return await Promise.all(promises);
  } catch (error) {
    throw new Error(`Error while fetching: ${error}`);
  }
};

exports.createSale = async (req, res) => {
  let {
    mobile_number,
    bill_amount,
    amount_paid,
    points_redeemed = 0,
    items,
    loyalty_type = null,
    reward_id = null,
  } = req.body;
  try {
    const [
      customerDetails,
      {
        amount_spent_per_point,
        min_point_to_redeem,
        amount_gained_per_point,
        reward_list,
      },
    ] = await getCustomerAndLoyaltyConfig(mobile_number);

    let loyalty_discount_amount = 0;
    let points_gained = Math.floor(amount_paid / amount_spent_per_point);
    let customerData = null;
    let customerPayload = null;
    let visitData = null;
    let visitPayload = null;
    let reward = null;

    if (!customerDetails) {
      customerPayload = createCustomerData({ ...req.body, points_gained });
      customerData = await customerController.createCustomer(
        customerPayload,
        (response) => response
      );
    } else {
      if (
        customerDetails.total_loyalty_points < points_redeemed ||
        (points_redeemed &&
          customerDetails.total_loyalty_points < min_point_to_redeem)
      )
        throw new Error("Customer dont have enough loyalty points to redeem!");

      if (loyalty_type == "C") {
        loyalty_discount_amount = points_redeemed * amount_gained_per_point;
      } else if (loyalty_type == "R") {
        reward = reward_list.find((item) => item.id == reward_id);
        if (customerDetails.total_loyalty_points < reward?.points)
          throw new Error(
            `This reward requires ${reward?.points} loyalty points to redeem!`
          );
        loyalty_discount_amount = calculateDiscountAmount(reward, bill_amount);
        points_redeemed = reward?.points || 0;
      }
      customerData = await updateCustomerData({
        ...req.body,
        ...customerDetails,
        points_gained,
        items,
        points_redeemed,
      });
    }

    visitPayload = createVisitData({
      ...req.body,
      loyalty_discount_amount,
      points_gained,
      points_redeemed,
      customerData,
      reward,
    });

    visitData = await visitController.createVisit(
      visitPayload,
      (response) => response
    );

    await visitItemController.uploadVisitsItems(items, visitData.id);

    res.status(200).send(visitData);
  } catch (error) {
    console.log(String(error), "error");
    res.status(400).send(String(error));
  }
};
