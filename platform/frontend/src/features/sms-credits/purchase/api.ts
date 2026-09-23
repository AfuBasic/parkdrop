import { fetchApi } from '@/lib/api';
import type { SmsCreditBundle, SmsCreditPurchase } from './types';

export interface BundlesResponse {
  bundles: SmsCreditBundle[];
  currency: string;
}

export interface CreatePurchaseResponse {
  purchase: SmsCreditPurchase;
}

export interface PurchaseStatusResponse {
  purchase: SmsCreditPurchase;
  wallet_balance: number;
}

export async function fetchCreditBundles(): Promise<BundlesResponse> {
  const res = await fetchApi('/api/v1/sms-credit-purchases/bundles');
  return res.json();
}

export async function initializePurchase(
  bundleKey: string,
  callbackUrl?: string,
  provider?: 'paystack' | 'flutterwave'
): Promise<CreatePurchaseResponse> {
  const res = await fetchApi('/api/v1/sms-credit-purchases', {
    method: 'POST',
    body: JSON.stringify({
      bundle_key: bundleKey,
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
