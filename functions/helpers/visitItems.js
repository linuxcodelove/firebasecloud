const { Timestamp } = require("firebase-admin/firestore");
exports.setVisitItemPayload = (obj) => {
  const {
    account_id,
    amount,
    amount_paid,
    customer_id,
    customer_name,
    discounts,
    item_category1,
    item_category2,
    item_category3,
    item_id,
    item_name,
    item_price,
    mobile_number,
    quantity,
    seasonal,
    special_offer,
    veg_or_non_veg,
    // visit_id,
    department_name,
    department_id,
    visits,
  } = obj;

  const obj2 = {
    account_id,
    amount,
    amount_paid,
    customer_id,
    customer_name,
    discounts,
    item_category1,
    item_category2,
    item_category3,
    item_id,
    item_name,
    item_price,
    mobile_number,
    quantity,
    seasonal,
    special_offer,
    veg_or_non_veg,
    // visit_id,
    department_name,
    department_id,
    visits,
  };
  obj2.visits.check_closer_time =
    Timestamp.fromDate(new Date(obj2.visits.check_closer_time)) || null;
  obj2.visits.visit_date_time =
    Timestamp.fromDate(new Date(obj2.visits.visit_date_time)) || null;
  return obj2;
};
