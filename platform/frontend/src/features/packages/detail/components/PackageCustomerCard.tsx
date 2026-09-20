import { Phone, User } from 'lucide-react';
import type { LocalCustomer } from '@/offline/db/schema';

interface PackageCustomerCardProps {
  customer: LocalCustomer | null;
}

export function PackageCustomerCard({ customer }: PackageCustomerCardProps) {
  if (!customer) {
    return (
      <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-active flex items-center justify-center text-text-muted">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary text-sm">Unknown Customer</h3>
          <p className="text-xs text-text-muted">Customer details not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-action-primary/10 text-action-primary flex items-center justify-center font-bold text-base">
          {customer.name ? customer.name[0].toUpperCase() : 'C'}
        </div>
        <div>
          <h3 className="font-bold text-text-primary text-base leading-tight">
            {customer.name}
          </h3>
          <p className="text-sm font-medium text-text-secondary mt-0.5 tabular-nums">
            {customer.phone_display || customer.phone_normalized}
          </p>
        </div>
      </div>

      {customer.phone_normalized && (
        <a
          href={`tel:${customer.phone_normalized}`}
          className="p-3 bg-action-primary/10 text-action-primary hover:bg-action-primary/20 active:scale-95 rounded-full transition-all flex items-center justify-center cursor-pointer"
          aria-label={`Call ${customer.name}`}
        >
          <Phone className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
