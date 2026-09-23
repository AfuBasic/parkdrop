import { fetchApi } from '@/lib/api';

export const packagesApi = {
  async resendArrivalSms(packageId: string): Promise<{ message: string }> {
    const res = await fetchApi(`/api/v1/packages/${packageId}/resend-sms`, {
      method: 'POST',
    });
    return res.json();
  },
};
