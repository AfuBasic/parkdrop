import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';

export default function VerifyOtp({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    fetch('/admin/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '' },
      body: JSON.stringify({ email, code }),
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed');
        window.location.href = '/admin/dashboard';
      })
      .catch(() => {
        setErr('Invalid code. Please try again.');
        setBusy(false);
      });
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-[#0D1B2A] mb-2">Enter your code</h1>
      <p className="text-sm text-[#475569] mb-6">We sent a 6-digit code to {email}</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-1">Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/, ''))}
            placeholder="000000"
            required
            autoFocus
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] min-h-[48px]"
          />
        </div>

        {err && <p className="text-sm text-[#B91C1C]">{err}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#2563EB] text-white font-semibold text-lg py-3 min-h-[48px] hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors">
          {busy ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </AuthLayout>
  );
}
