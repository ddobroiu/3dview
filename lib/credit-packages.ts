// lib/credit-packages.ts

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  features: string[];
  stripePriceId?: string; // pentru Stripe integration
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 9,
    features: [
      '10 3D Generations',
      'HD Video Output', 
      'Standard Processing',
      'Download Rights'
    ],
    stripePriceId: 'price_starter_10_credits'
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 50,
    price: 29,
    popular: true,
    features: [
      '50 3D Generations',
      '4K Video Output',
      'Priority Processing', 
      'Commercial License',
      'Email Support'
    ],
    stripePriceId: 'price_professional_50_credits'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 250,
    price: 99,
    features: [
      '250 3D Generations',
      '8K Video Output',
      'Instant Processing',
      'API Access',
      'Priority Support'
    ],
    stripePriceId: 'price_enterprise_250_credits'
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    credits: 1000,
    price: 299,
    bonus: 200,
    features: [
      '1000 + 200 Bonus Credits',
      '8K Video Output',
      'Instant Processing',
      'API Access',
      'Dedicated Support',
      'Custom Branding'
    ],
    stripePriceId: 'price_ultimate_1000_credits'
  }
];

export function getCreditPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === id);
}

export function getCreditPackageByStripePrice(stripePriceId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.stripePriceId === stripePriceId);
}