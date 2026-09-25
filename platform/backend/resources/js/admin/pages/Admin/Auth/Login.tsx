import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { Link } from '@inertiajs/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');

    fetch('/admin/login/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      body: JSON.stringify({ email }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        window.location.href = '/admin/login/verify';
      })
      .catch(() => {
        setErr('Could not send code. Please try again.');
        setBusy(false);
      });
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-[#0D1B2A] mb-2">Admin login</h1>
      <p className="text-sm text-[#475569] mb-6">Enter your email and we will send a login code.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0D1B2A] mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@afutunde.com"
            required
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-[17px] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] min-h-[48px]"
          />
        </div>

        {err && <p className="text-sm text-[#B91C1C]">{err}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#2563EB] text-white font-semibold text-lg py-3 min-h-[48px] hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors">
          {busy ? 'Sending...' : 'Send login code'}
        </button>
      </form>
    </AuthLayout>
  );
}
