import { fetchApi } from '@/lib/api';

export interface InvitationPreview {
  email: string;
  email_normalized: string;
  business_name: string | null;
  role: string;
  status: string;
  expires_at: string;
}

export const invitationsApi = {
  async preview(invitationId: string, token: string): Promise<InvitationPreview> {
    const res = await fetchApi(
      `/api/v1/business/invitations/${invitationId}?token=${encodeURIComponent(token)}`
    );
    return res.json();
  },
};
