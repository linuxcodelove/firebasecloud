const { Timestamp } = require("firebase-admin/firestore");

exports.formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return Timestamp.fromDate(new Date(`${year}-${month}-${day}`));
};

exports.formSimpleQuery = (fieldName, obj, db) => {
  var query = db;
  Object.keys(obj).forEach((k) => {
    const { symbol, value } = obj[k];
    if (!value) return;
    query = query.where(fieldName, symbol, value);
  });
  return query;
};
