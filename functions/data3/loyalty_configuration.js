const loyaltyConfguration = [
  {
    id: 1,
    point_per_rupee: 0.01,
    rupee_per_point: 1,
    min_point_to_redeem: 100,
    free_items: [
      {
        id: 2001,
        name: "coke",
        points: 100,
      },
      {
        id: 2002,
        name: "Rum",
        points: 500,
      },
      {
        id: 2003,
        name: "Brandy",
        points: 400,
      },
    ],
    flat_discount: [
      {
        price: 1000,
        points: 100,
      },
      {
        name: 5000,
        points: 500,
      },
      {
        name: 10000,
        points: 1000,
      },
    ],
    percentage_discount: [
      {
        percentage: 10,
        points: 200,
        max_discount: null,
      },
      {
        percentage: 15,
        points: 300,
        max_discount: null,
      },
    ],
    // expires_in_years: 1,
  },
];

module.exports = loyaltyConfguration;
