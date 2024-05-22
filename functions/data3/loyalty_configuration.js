const loyaltyConfguration = [
  {
    id: 1,
    point_per_rupee: 0.01,
    rupee_per_point: 1,
    min_point_to_redeem: 100,
    reward_list: [
      {
        id: 1,
        points: 300,
        discount_percentage: 10,
        max_discount: 1000,
        name: "10% off on entire purchase",
      },

      {
        id: 2,
        points: 500,
        discount_percentage: 20,
        max_discount: 2000,
        name: "20% off on entire purchase",
      },
      {
        id: 3,
        points: 300,
        name: "1000₹ off on entire purchase",
        discount_amount: 1000,
      },
      {
        id: 4,
        points: 100,
        free_items: [2001],
        name: "Free Coke",
      },
    ],
  },
];

module.exports = loyaltyConfguration;
