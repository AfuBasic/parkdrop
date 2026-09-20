import * as React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  Button 
} from '@/design-system';
import { Mail, HelpCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { notify } from '@/lib/notify';

interface ProblemLoggingInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
}

const SUPPORT_EMAIL = 'support@parkdrop.com.ng';

export function ProblemLoggingInSheet({
  open,
  onOpenChange,
  email,
}: ProblemLoggingInSheetProps) {
  const [copied, setCopied] = React.useState(false);

  const subject = encodeURIComponent(
    email 
      ? `ParkDrop Sign-In Assistance: ${email}` 
      : 'ParkDrop Sign-In Assistance'
  );

  const body = encodeURIComponent(
    `Hello ParkDrop Support,\n\nI am experiencing an issue signing into my account${email ? ` (${email})` : ''}.\n\nDetails of what happened:\n- `
  );

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      notify.success('Support email copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify.error(null, 'Could not copy to clipboard');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="w-full max-w-lg mx-auto p-6 sm:p-8">
        <SheetHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-action-primary/10 text-action-primary flex items-center justify-center mb-1">
            <HelpCircle className="w-6 h-6" />
          </div>
          <SheetTitle className="text-xl font-bold text-text-primary tracking-tight">
            Need help signing in?
          </SheetTitle>
          <SheetDescription className="text-sm text-text-secondary leading-relaxed">
            If you are having trouble receiving confirmation codes, accessing your account, or resetting your PIN, contact the platform creator directly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {/* Email Support Card */}
          <div className="p-4 rounded-2xl border border-border-default bg-surface-subtle/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Support & Inquiries
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-status-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-default border border-border-default">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Mail className="w-4 h-4 text-action-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-text-primary truncate select-all">
                  {SUPPORT_EMAIL}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs text-text-secondary hover:text-text-primary flex-shrink-0"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-status-success font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Guidance Checklist */}
          <div className="rounded-xl bg-surface-page p-3.5 text-xs text-text-secondary space-y-2 border border-border-subtle">
            <p className="font-semibold text-text-primary">Quick tips before emailing:</p>
            <ul className="list-disc pl-4 space-y-1 text-text-muted">
              <li>Check your email spam / junk or promotions folder.</li>
              <li>Ensure your email address was typed correctly without typos.</li>
              <li>Wait at least 60 seconds before requesting a fresh confirmation code.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
              onClick={() => {
                window.location.href = mailtoUrl;
              }}
            >
              <Mail className="w-4 h-4" />
              Send Email to Creator
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto h-12 text-sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
