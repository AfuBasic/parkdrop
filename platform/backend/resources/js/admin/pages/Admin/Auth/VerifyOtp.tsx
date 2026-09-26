import { useState, useEffect } from 'react';
import AuthLayout from '@/layouts/AuthLayout';

export default function VerifyOtp({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setResendSuccess('');

    fetch('/admin/login/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      body: JSON.stringify({ email, code }),
    })
      .then(r => {
        if (!r.ok) {
          return r.json().then(data => {
            throw new Error(data.message || 'Invalid code. Please try again.');
          });
        }
        window.location.href = '/admin/dashboard';
      })
      .catch((e: any) => {
        setErr(e.message || 'Invalid code. Please try again.');
        setBusy(false);
      });
  };

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cooldown > 0 || resending) return;

    setResending(true);
    setErr('');
    setResendSuccess('');

    fetch('/admin/login/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      body: JSON.stringify({ email }),
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to resend code');
        return r.json();
      })
      .then(() => {
        setResendSuccess('A new login code has been sent.');
        setCooldown(60);
      })
      .catch(() => {
        setErr('Could not resend code. Please try again in a few moments.');
      })
      .finally(() => {
        setResending(false);
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
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            autoFocus
            className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] min-h-[48px]"
          />
        </div>

        {err && <p className="text-sm text-[#B91C1C]">{err}</p>}
        {resendSuccess && <p className="text-sm text-[#16A34A]">{resendSuccess}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#2563EB] text-white font-semibold text-lg py-3 min-h-[48px] hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
        >
          {busy ? 'Verifying...' : 'Verify'}
        </button>

        <div className="pt-2 text-center text-sm text-[#475569]">
          <span>Didn't receive the code? </span>
          {cooldown > 0 ? (
            <span className="text-[#94A3B8] font-medium">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="text-center pt-1">
          <a href="/admin/login" className="text-xs text-[#64748B] hover:text-[#0D1B2A]">
            Use a different email
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
