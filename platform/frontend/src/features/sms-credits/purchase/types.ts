export interface SmsCreditBundle {
  key: string;
  credits: number;
  amount_minor: number;
  currency: string;
  label: string;
  description?: string;
}

export interface SmsCreditPurchase {
  id: string;
  bundle_key: string;
  credits: number;
  amount_minor: number;
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
