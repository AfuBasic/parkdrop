import React, { useState } from 'react';
import { LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Dialog } from './dialog';

interface LogoutConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutConfirmModal({ open, onOpenChange }: LogoutConfirmModalProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    try {
      const response = await fetch('/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
      });

      if (response.ok || response.redirected || response.status === 419 || response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      // If unexpected response status
      const data = await response.json().catch(() => null);
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      
      // Fallback redirect anyway since session could be logged out
      window.location.href = '/admin/login';
    } catch (e: any) {
      // In case of network error, attempt direct window location redirect to login
      window.location.href = '/admin/login';
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!loggingOut) {
          setError(null);
          onOpenChange(val);
        }
      }}
      title="Sign Out of Admin Console"
      description="You will need to verify via email OTP to sign back in."
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Are you sure you want to end your administrative session? Any unsaved changes in current forms will be discarded.
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loggingOut}
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-75 shadow-xs"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Confirm Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
