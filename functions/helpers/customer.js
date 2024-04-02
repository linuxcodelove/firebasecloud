const { Timestamp } = require("firebase-admin/firestore");

exports.setPayload = (obj, ind = null) => {
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
  };
  if (ind) {
    obj2.id = ind;
    obj2.dob = Timestamp.fromDate(new Date(obj2.dob)) || null;
    obj2.last_visited_date = Timestamp.fromDate(
      new Date(obj2.last_visited_date)
    );
  }
  return obj2;
};
