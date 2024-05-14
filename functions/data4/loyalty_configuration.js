const loyaltyConfguration = [
  {
    id: 1,
    point_per_rupee: 0.01,
    rupee_per_point: 1,
    min_point_to_redeem: 100,
    free_items: [
      {
        name: "Coke",
        points: 100,
      },
      {
        name: "Beer",
        points: 300,
      },
      {
        name: "Fried chicken",
        points: 50,
      },
    ],
    discount: [
      {
        percentage: 10,
        points: 200,
      },
      {
        percentage: 15,
        points: 300,
      },
    ],
    expires_in_years: 1
  },
];

module.exports = loyaltyConfguration;

