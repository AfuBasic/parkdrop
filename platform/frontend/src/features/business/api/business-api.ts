import { fetchApi } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/lib/api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';

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
    created_at: string | null;
  };
  current_pickup_point: {
    id: number;
    name: string;
    address: string | null;
    landmark: string | null;
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
};
