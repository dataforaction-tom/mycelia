export const PLAN_LIMITS = {
  trial: {
    users: 10,
    connections: 1000,
    spaces: 5,
    momentsPerMonth: 5000,
    mutualConnections: 50,
  },
  individual: {
    users: 1,
    connections: 200,
    spaces: 1,
    momentsPerMonth: 500,
    mutualConnections: 0,
  },
  organisation: {
    users: 10,
    connections: 1000,
    spaces: 5,
    momentsPerMonth: 5000,
    mutualConnections: 50,
  },
  large: {
    users: 25,
    connections: Infinity,
    spaces: Infinity,
    momentsPerMonth: Infinity,
    mutualConnections: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const PLAN_PRICES = {
  individual: {
    monthly: 500, // pence
    annual: 5000,
    stripePriceId:
      process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? "",
  },
  organisation: {
    monthly: 2500,
    annual: 25000,
    stripePriceId:
      process.env.STRIPE_PRICE_ORGANISATION_MONTHLY ?? "",
  },
  large: {
    monthly: 5000,
    annual: 50000,
    stripePriceId:
      process.env.STRIPE_PRICE_LARGE_MONTHLY ?? "",
    additionalUserPriceId:
      process.env.STRIPE_PRICE_LARGE_ADDITIONAL_USERS ?? "",
    additionalUserPrice: 200, // pence per user per month
  },
} as const;
