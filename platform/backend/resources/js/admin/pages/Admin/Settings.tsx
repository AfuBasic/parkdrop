export default function Settings({ admin }: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Settings</h1>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs text-[#475569] uppercase tracking-wide mb-1">Email</label>
          <p className="text-sm text-[#0D1B2A]">{admin?.email}</p>
        </div>
        <div>
          <label className="block text-xs text-[#475569] uppercase tracking-wide mb-1">Display Name</label>
          <p className="text-sm text-[#0D1B2A]">{admin?.displayName}</p>
        </div>
        <div>
          <label className="block text-xs text-[#475569] uppercase tracking-wide mb-1">Last Login</label>
          <p className="text-sm text-[#0D1B2A]">{admin?.lastLoginAt || 'Never'}</p>
        </div>
        <div>
          <label className="block text-xs text-[#475569] uppercase tracking-wide mb-1">Email Verified</label>
          <p className="text-sm text-[#0D1B2A]">{admin?.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}
