export interface SmsCreditPricing {
  price_per_credit_minor: number;
  currency: string;
  min_credits: number;
  max_credits: number;
}

export interface SmsCreditPurchasePreview {
  credits: number;
  net_amount_minor: number;
  fee_minor: number;
  amount_minor: number;
  currency: string;
}

export interface SmsCreditPurchase {
  id: string;
  bundle_key: string;
  credits: number;
  amount_minor: number;
  fee_minor: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  reference: string;
  checkout_url?: string;
  paid_at?: string | null;
  failed_at?: string | null;
  created_at: string;
}

export type PurchaseFlowState =
  | 'CHOOSING'
  | 'INITIALIZING'
  | 'CONFIRMING'
  | 'PAID'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED';
