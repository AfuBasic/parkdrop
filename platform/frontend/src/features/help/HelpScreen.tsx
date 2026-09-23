import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  ArrowLeft, 
  HelpCircle, 
  Search, 
  Package, 
  Key, 
  CreditCard, 
  CheckCircle2, 
  RotateCcw, 
  MessageSquare, 
  Coins, 
  WifiOff, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  steps: string[];
  tips?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with ParkDrop',
    category: 'Basics',
    icon: Sparkles,
    summary: 'ParkDrop is offline-first parcel holding and pickup point software designed for fast motor park and pickup point operations.',
    steps: [
      'Sign in with your phone or email. We send you a 6-digit code, no password needed.',
      'If you are an Owner, create your Business and initial Pickup Point.',
      'Record packages as they arrive from dispatchers or customers.',
      'When customers arrive, verify their pickup code and release the parcel.'
    ],
    tips: 'ParkDrop works completely offline once signed in on this device. Changes sync automatically when internet is available.'
  },
  {
    id: 'recording-packages',
    title: 'Recording a Package (Intake)',
    category: 'Operations',
    icon: Package,
    summary: 'Intake parcels quickly using the customer phone number and optional details.',
    steps: [
      'Tap "Add package" on the Home screen.',
      'Enter the customer\'s phone number. Existing customers are automatically retrieved.',
      'Enter the amount due if the customer needs to pay on collection (₦0 if already paid).',
      'Optionally take a parcel photo to record parcel condition.',
      'Choose whether to send an arrival SMS to the customer.',
      'Tap "Save package". A unique 7-character pickup code is immediately generated.'
    ],
    tips: 'If you are offline, photos and packages are saved securely in device storage and uploaded as soon as connectivity resumes.'
  },
  {
    id: 'pickup-codes',
    title: 'Understanding Pickup Codes',
    category: 'Operations',
    icon: Key,
    summary: 'Pickup codes are 7-character security codes used to authenticate the collecting customer.',
    steps: [
      'Every package receives a unique pickup code when recorded.',
      'The pickup code is delivered to the customer via SMS (if SMS was enabled) or shared by the sender.',
      'When the customer arrives to collect, ask them for this code.',
      'Enter the code during collection to verify authorization.'
    ],
    tips: 'The pickup code is different from the public Package ID (e.g. PD-4K72Q). The code prevents wrongful package handover.'
  },
  {
    id: 'collecting-packages',
    title: 'Collecting & Releasing a Package',
    category: 'Operations',
    icon: CheckCircle2,
    summary: 'Hand over parcels safely to customers with payment and code verification.',
    steps: [
      'Search for the package using the customer phone, name, or pickup code.',
      'Open the Package Detail screen.',
      'If an unpaid balance remains, tap "Record payment" to record the cash, transfer, or POS payment.',
      'Tap "Release package". ParkDrop shows the pickup code on screen.',
      'Check it matches what the customer tells you, then tap to confirm the release.'
    ],
    tips: 'Once collected, the package status permanently changes to Collected and moves to the Collected tab.'
  },
  {
    id: 'recording-payments',
    title: 'Recording Package Payments',
    category: 'Finance',
    icon: CreditCard,
    summary: 'Record money received by your business at the pickup point.',
    steps: [
      'Open the package on the Package Detail screen.',
      'Tap "Record payment" next to the payment summary card.',
      'Enter the amount received and select the payment method (Cash, Transfer, POS, or Other).',
      'Tap "Save payment". The balance updates immediately.'
    ],
    tips: 'ParkDrop records the transaction for your business reports. ParkDrop does not hold or take a cut of package collection money.'
  },
  {
    id: 'finding-packages',
    title: 'Finding & Searching Packages',
    category: 'Operations',
    icon: Search,
    summary: 'Quickly find any package on your shelf or in your history.',
    steps: [
      'Tap "Find package" on Home, or go to the Packages tab.',
      'Search by customer phone number, customer name, public package ID, or pickup code.',
      'Filter by status (Waiting, Collected, Returned, Cancelled) to narrow down items.'
    ],
    tips: 'Search runs locally on your device database with instant results.'
  },
  {
    id: 'returning-cancelling',
    title: 'Returning or Cancelling Packages',
    category: 'Operations',
    icon: RotateCcw,
    summary: 'Handle parcels that cannot be delivered or need to be returned to the sender.',
    steps: [
      'Open the package on the Package Detail screen.',
      'Tap "Return package" if returning to sender or "Cancel package" if voiding intake.',
      'Select a reason (e.g. Customer did not collect, Damaged, Wrong destination).',
      'Provide a short explanatory note if required.',
      'Confirm the terminal status transition.'
    ]
  },
  {
    id: 'customer-sms',
    title: 'Customer SMS Notifications',
    category: 'Messaging',
    icon: MessageSquare,
    summary: 'How SMS notifications work and what customers receive.',
    steps: [
      'When recording a package, enable "Send arrival SMS".',
      'The customer receives a text naming your pickup point and park, with the 7-character pickup code to show at collection.',
      'If SMS delivery fails or credits are zero, the package still saves safely and the code can be given manually.'
    ]
  },
  {
    id: 'sms-credits',
    title: 'SMS Credit Balance & Purchases',
    category: 'Messaging',
    icon: Coins,
    summary: 'ParkDrop is free to use; credits are only required for customer SMS alerts.',
    steps: [
      'Check your balance anytime under "More > SMS Credits".',
      'Owners and Managers can purchase bundles (e.g. 100, 250, 500, or 1000 credits).',
      'Payments are processed securely via Paystack.',
      'Your wallet balance updates immediately upon payment verification.'
    ],
    tips: 'If you run out of credits, packages can still be intake and released without interruption.'
  },
  {
    id: 'working-offline',
    title: 'Working Offline & Syncing',
    category: 'Offline Engine',
    icon: WifiOff,
    summary: 'How ParkDrop keeps working when internet drops in the motor park.',
    steps: [
      'If connectivity drops, the top bar shows "No internet".',
      'You can continue recording packages, payments, and collections without delay.',
      'All changes are saved on this device and stay there until you are back online.',
      'When your connection is restored, pending changes sync automatically to the cloud.'
    ],
    tips: 'Buying SMS credits, inviting staff, and editing business details require an active internet connection.'
  },
  {
    id: 'security-devices',
    title: 'Account, Sessions & Device Security',
    category: 'Security',
    icon: ShieldCheck,
    summary: 'Passwordless authentication and device management.',
    steps: [
      'ParkDrop uses passwordless sign-in: a code sent to your phone or email, no password to remember.',
      'You can review active devices and sessions under "More > Account & Security".',
      'Lost or stolen devices can be remotely signed out to revoke access immediately.'
    ]
  }
];

interface HelpScreenProps {
  onBack?: () => void;
  initialTopicId?: string | null;
}

export function HelpScreen({ onBack, initialTopicId }: HelpScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialTopicId || null);

  const selectedArticle = HELP_ARTICLES.find(a => a.id === selectedArticleId);

  if (selectedArticle) {
    const Icon = selectedArticle.icon;
    return (
      <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-8">
        {/* Header */}
        <header className="px-4 py-3 bg-surface-default border-b border-border-subtle flex items-center gap-3 sticky top-0 z-10">
          <button
            type="button"
            onClick={() => setSelectedArticleId(null)}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Back to topics"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-action-primary uppercase tracking-wider">
              {selectedArticle.category}
            </span>
            <h1 className="text-base font-bold text-text-primary truncate">
              {selectedArticle.title}
            </h1>
          </div>
        </header>

        {/* Body Content */}
        <main className="p-4 flex flex-col gap-4">
          <div className="p-4 bg-surface-default rounded-2xl border border-border-subtle shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-action-primary flex items-center justify-center mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-text-primary leading-relaxed">
              {selectedArticle.summary}
            </p>
          </div>

          <div className="bg-surface-default rounded-2xl border border-border-subtle p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Step-by-step guidance
            </h2>
            <ol className="flex flex-col gap-3">
              {selectedArticle.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-action-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug text-text-primary">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {selectedArticle.tips && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-text-secondary leading-relaxed">
              <span className="font-bold text-action-primary block mb-1">Practical Tip</span>
              {selectedArticle.tips}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelectedArticleId(null)}
            className="w-full py-3 bg-surface-default border border-border-default hover:bg-surface-subtle text-text-primary font-semibold text-xs rounded-xl transition-colors min-h-[44px] cursor-pointer mt-2"
          >
            Browse other help topics
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-8">
      {/* Header */}
      <header className="px-4 py-3 bg-surface-default border-b border-border-subtle flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-action-primary" />
          <h1 className="text-lg font-bold text-text-primary">Help & Guides</h1>
        </div>
      </header>

      {/* Main List */}
      <main className="p-4 flex flex-col gap-4">
        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-text-secondary">
          <p className="font-semibold text-action-primary text-sm mb-1">Offline-Ready Help</p>
          All guides are stored on your device so you can consult them even without an internet connection.
        </div>

        <div className="bg-surface-default rounded-2xl border border-border-subtle shadow-xs divide-y divide-border-subtle overflow-hidden">
          {HELP_ARTICLES.map((article) => {
            const Icon = article.icon;
            return (
              <button
                key={article.id}
                type="button"
                onClick={() => setSelectedArticleId(article.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[56px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      {article.category}
                    </span>
                    <h2 className="text-sm font-semibold text-text-primary">
                      {article.title}
                    </h2>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
