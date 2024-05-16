const { Timestamp } = require("firebase-admin/firestore");

exports.setPayload = (obj, ind = null) => {
  const {
    id,
    title,
    description,
    start_date,
    end_date,
    applicable_customers,
    customers,
    applicable_count,
    is_loyalty_redeemable,
    minimum_purchase,
    offer_type,
    start_time,
    end_time,
    discount_percentage,
    discount_price,
    free_items,
    buy_one_get_one,
    buy_two_get_one,
    one_for_one,
    one_for_two
  } = obj;

  const obj2 = {
    id,
    title,
    description,
    start_date,
    end_date,
    applicable_customers,
    customers,
    applicable_count,
    is_loyalty_redeemable,
    minimum_purchase,
    offer_type,
    start_time,
    end_time,
    discount_percentage,
    discount_price,
    free_items,
    buy_one_get_one,
    buy_two_get_one,
    one_for_one,
    one_for_two
  };
  if (ind) {
    obj2.id = ind;
  }
  return obj2;
};
