import { db } from '@/offline/db/database';
import type { LocalSmsWallet, LocalSmsCreditTransaction } from '@/offline/db/schema';

export class SmsWalletRepository {
  /**
   * Get the SMS wallet for a business from local Dexie database.
   */
  static async getWallet(businessId: number): Promise<LocalSmsWallet | undefined> {
    return await db.smsWallets.where('business_id').equals(businessId).first();
  }

  /**
   * Get recent transactions for a wallet sorted by creation date descending.
   */
  static async getTransactions(smsWalletId: number, limit: number = 50): Promise<LocalSmsCreditTransaction[]> {
    const list = await db.smsCreditTransactions
      .where('sms_wallet_id')
      .equals(smsWalletId)
      .toArray();

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  }

  /**
   * Upsert a wallet into local Dexie store.
   */
  static async saveWallet(wallet: LocalSmsWallet): Promise<void> {
    await db.smsWallets.put(wallet);
  }

  /**
   * Upsert a credit transaction into local Dexie store.
   */
  static async saveTransaction(transaction: LocalSmsCreditTransaction): Promise<void> {
    await db.smsCreditTransactions.put(transaction);
  }
}
