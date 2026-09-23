import { fetchApi } from '@/lib/api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';

export interface StaffMember {
  id: number;
  user_id: number;
  name: string | null;
  email: string;
  role: BusinessRole;
  status: string;
  joined_at: string | null;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: BusinessRole;
  status: 'pending';
  invited_by_name: string | null;
  expires_at: string;
  created_at: string;
}

export interface StaffListResponse {
  current_user_role: BusinessRole;
  members: StaffMember[];
  invitations: PendingInvitation[];
}

export interface BusinessDetailsResponse {
  business: {
    id: number;
    public_id: string;
    name: string;
    status: string;
    /** In kobo. Added to a package's initial fee per extra day it sits uncollected. */
    daily_storage_fee_minor: number;
    created_at: string | null;
  };
  current_pickup_point: {
    id: number;
    name: string;
    park_name?: string | null;
    contact_phone?: string | null;
    contact_phone_confirmed_at?: string | null;
    address?: string | null;
    landmark?: string | null;
  } | null;
  current_user_role: BusinessRole;
}

export const businessApi = {
  async getStaffList(): Promise<StaffListResponse> {
    const res = await fetchApi('/api/v1/business/staff');
    return res.json();
  },

  async inviteStaff(email: string, role: BusinessRole): Promise<{ message: string; invitation: PendingInvitation }> {
    const res = await fetchApi('/api/v1/business/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  async resendInvitation(invitationId: string): Promise<{ message: string }> {
    const res = await fetchApi(`/api/v1/business/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
    return res.json();
  },

  async revokeInvitation(invitationId: string): Promise<{ message: string }> {
    const res = await fetchApi(`/api/v1/business/invitations/${invitationId}/revoke`, {
      method: 'POST',
    });
    return res.json();
  },

  async changeMemberRole(membershipId: number, role: BusinessRole): Promise<{ message: string }> {
    const res = await fetchApi(`/api/v1/business/members/${membershipId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

  async removeMember(membershipId: number): Promise<{ message: string }> {
    const res = await fetchApi(`/api/v1/business/members/${membershipId}/remove`, {
      method: 'POST',
    });
    return res.json();
  },

  async getBusinessDetails(): Promise<BusinessDetailsResponse> {
    const res = await fetchApi('/api/v1/business/details');
    return res.json();
  },

  async updateBusinessName(name: string): Promise<{ message: string }> {
    const res = await fetchApi('/api/v1/business/details', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  async updateDailyStorageFee(dailyStorageFeeMinor: number): Promise<{ message: string }> {
    const res = await fetchApi('/api/v1/business/details', {
      method: 'PATCH',
      body: JSON.stringify({ daily_storage_fee_minor: dailyStorageFeeMinor }),
    });
    return res.json();
  },

  async updatePickupPoint(
    pickupPointId: number,
    data: { name: string; park_name?: string | null; contact_phone?: string | null }
  ): Promise<{ message: string; pickup_point: any }> {
    const res = await fetchApi(`/api/v1/business/pickup-points/${pickupPointId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
