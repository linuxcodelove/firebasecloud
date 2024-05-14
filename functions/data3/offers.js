const offers = [
  {
    title: "Summer Specials",
    description: "Summer sale offer",
    start_date: "2024-05-13",
    end_date: "2024-05-31",
    applicable_customers: 1,
    customers: null,
    applicable_count: 1, // offer can be availed once
    is_loyalty_redeemable: false,
    minimum_purchase: 1000,
    offer_type: 1,
    discount_percentage: { discount: 15, maximum_amount: 1500 },
    discount_price: 1000,
    free_items: [15792, 15501, 24966],
    buy_one_get_one: {
      buy_item: 15782,
      sell_item: 24966,
    },
    buy_two_get_one: {
      buy_item1: 15782,
      buy_item2: 15501,
      sell_item: 24966,
    },
  },
];

//applicable customers
// 1 - all customers
// 2 - specific customers

// offer type
// 1 - Percentage discount
// 2 - price discount
// 3 - Free item
// 4 - Buy 1 get 1

module.exports = offers;
