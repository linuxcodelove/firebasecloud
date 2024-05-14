const { Timestamp } = require("firebase-admin/firestore");

exports.setCustomerPayload = (obj) => {
  const {
    account_id,
    address1,
    address2,
    area,
    city,
    communication_channel,
    country,
    customer_id,
    customer_name,
    dob,
    email,
    gender,
    last_visited_date,
    last_visited_store,
    last_spent_amount,
    mobile_number,
    occupation,
    top_visited_store,
    total_spent,
    visits_count,
    whatsapp_number,
    total_loyalty_points,
    created_at,
  } = obj;

  const obj2 = {
    account_id,
    address1,
    address2,
    area,
    city,
    communication_channel,
    country,
    customer_id,
    customer_name,
    dob,
    email,
    gender,
    last_visited_date,
    last_visited_store,
    last_spent_amount,
    mobile_number,
    occupation,
    top_visited_store,
    total_spent,
    visits_count,
    whatsapp_number,
    total_loyalty_points,
    created_at,
  };
  obj2.dob = Timestamp.fromDate(new Date(obj2.dob)) || null;
  obj2.last_visited_date = Timestamp.fromDate(new Date(obj2.last_visited_date));
  obj2.created_at = Timestamp.fromDate(new Date(obj2.created_at));
  return obj2;
};
