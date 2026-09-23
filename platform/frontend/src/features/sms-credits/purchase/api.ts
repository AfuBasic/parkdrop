import { fetchApi } from '@/lib/api';
import type { SmsCreditPricing, SmsCreditPurchase } from './types';

export interface CreatePurchaseResponse {
  purchase: SmsCreditPurchase;
}

export interface PurchaseStatusResponse {
  purchase: SmsCreditPurchase;
  wallet_balance: number;
}

export async function fetchCreditPricing(): Promise<SmsCreditPricing> {
  const res = await fetchApi('/api/v1/sms-credit-purchases/pricing');
  return res.json();
}

export async function initializePurchase(
  credits: number,
  callbackUrl?: string,
  provider?: 'paystack' | 'flutterwave'
): Promise<CreatePurchaseResponse> {
  const res = await fetchApi('/api/v1/sms-credit-purchases', {
    method: 'POST',
    body: JSON.stringify({
      credits,
      callback_url: callbackUrl,
      provider,
    }),
  });
  return res.json();
}

export async function fetchPurchaseStatus(purchaseId: string): Promise<PurchaseStatusResponse> {
  const res = await fetchApi(`/api/v1/sms-credit-purchases/${purchaseId}`);
  return res.json();
}

export async function verifyPurchaseOnServer(purchaseId: string): Promise<PurchaseStatusResponse> {
  const res = await fetchApi(`/api/v1/sms-credit-purchases/${purchaseId}/verify`, {
    method: 'POST',
  });
  return res.json();
}
