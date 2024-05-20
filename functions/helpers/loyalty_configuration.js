const { Timestamp } = require("firebase-admin/firestore");
exports.setPayload = (obj, ind = null) => {
  const {
    point_per_rupee,
    rupee_per_point,
    min_point_to_redeem,
    reward_list,
    id
  } = obj;

  const obj2 = {
    point_per_rupee,
    rupee_per_point,
    min_point_to_redeem,
    reward_list,
    id
  };

  obj2.id = obj2.id ? obj2.id : ind;

  return obj2;
};
