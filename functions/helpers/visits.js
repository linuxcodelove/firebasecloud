const { Timestamp } = require("firebase-admin/firestore");
exports.setPayload = (obj, ind = null) => {
  const {
    account_id,
    amount,
    amount_paid,
    check_closer_time,
    customer_id,
    customer_name,
    discount,
    discount_percentage,
    feedback_rating,
    mobile_number,
    store_visited,
    store_id,
    time_spend_in_minutes,
    visit_date_time,
    visit_purpose,
    service_type,
    bill_number,
    sale_id,
    id,
  } = obj;

  const obj2 = {
    account_id,
    amount,
    amount_paid,
    check_closer_time,
    customer_id,
    customer_name,
    discount,
    discount_percentage,
    feedback_rating,
    mobile_number,
    store_visited,
    store_id,
    time_spend_in_minutes,
    visit_date_time,
    visit_purpose,
    service_type,
    bill_number,
    sale_id,
    id,
  };
  if (ind) {
    obj2.id = obj2.id ? obj2.id : ind;
    obj2.check_closer_time =
      Timestamp.fromDate(new Date(obj2.check_closer_time)) || null;
    obj2.visit_date_time =
      Timestamp.fromDate(new Date(obj2.visit_date_time)) || null;
  }

  return obj2;
};
