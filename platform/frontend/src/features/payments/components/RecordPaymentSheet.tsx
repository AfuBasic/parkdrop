import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle } from 'lucide-react';
import type { PaymentMethod } from '@/offline/db/schema';
import { PAYMENT_METHOD_LABELS } from '../domain/payment-summary';
import { formatMoney } from '@/lib/formatters';

interface RecordPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  remainingBalanceMinor: number;
  onRecord: (amountMinor: number, method: PaymentMethod) => Promise<void>;
}

export function RecordPaymentSheet({
  isOpen,
  onClose,
  remainingBalanceMinor,
  onRecord,
}: RecordPaymentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Remaining balance in whole Naira for initial suggestions
  const remainingNaira = Math.floor(remainingBalanceMinor / 100);

  const paymentSchema = z.object({
    amountNaira: z
      .string()
      .min(1, 'Enter an amount')
      .refine(
        val => {
          const num = Number(val.replace(/,/g, ''));
          return !isNaN(num) && num > 0;
        },
        { message: 'Amount must be greater than ₦0' }
      )
      .refine(
        val => {
          const num = Number(val.replace(/,/g, ''));
          const minor = Math.round(num * 100);
          return minor <= remainingBalanceMinor;
        },
        {
          message: `Amount cannot exceed remaining balance of ${formatMoney(remainingBalanceMinor)}`,
        }
      ),
    method: z.enum(['CASH', 'TRANSFER', 'POS', 'OTHER'], {
      required_error: 'Select a payment method',
    }),
  });

  type FormData = z.infer<typeof paymentSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amountNaira: remainingNaira > 0 ? String(remainingNaira) : '',
      method: 'CASH',
    },
  });

  const selectedMethod = watch('method');

  const handleFormSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setServerError(null);

    try {
      const cleanAmount = Number(data.amountNaira.replace(/,/g, ''));
      const amountMinor = Math.round(cleanAmount * 100);
      await onRecord(amountMinor, data.method as PaymentMethod);
      reset();
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not save payment. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile bottom sheet / Desktop modal container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        className="w-full max-w-md bg-surface-page rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)] border-t sm:border border-border-subtle p-6 shadow-2xl flex flex-col gap-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="record-payment-title" className="text-xl font-bold text-text-primary tracking-tight">
              Record payment
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Balance remaining:{' '}
              <span className="font-semibold text-text-primary">
                {formatMoney(remainingBalanceMinor)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-active transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && (
          <div className="p-3 bg-status-danger-bg border border-status-danger-border rounded-[var(--radius-lg)] flex items-start gap-2 text-sm text-status-danger-text">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amountNaira" className="text-sm font-semibold text-text-primary">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-medium text-lg">
                ₦
              </span>
              <input
                id="amountNaira"
                type="text"
                inputMode="numeric"
                autoFocus
                {...register('amountNaira')}
                className="w-full pl-9 pr-4 py-3.5 bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] text-xl font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all tabular-nums"
                placeholder="0"
              />
            </div>
            {errors.amountNaira && (
              <p className="text-xs text-status-danger-text font-medium mt-0.5">
                {errors.amountNaira.message}
              </p>
            )}
            {/* Quick pre-fill button for remaining balance */}
            {remainingBalanceMinor > 0 && (
              <button
                type="button"
                onClick={() => setValue('amountNaira', String(remainingNaira), { shouldValidate: true })}
                className="self-start text-xs text-action-primary font-medium hover:underline mt-1 cursor-pointer"
              >
                Pay full balance ({formatMoney(remainingBalanceMinor)})
              </button>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-primary">
              Payment method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['CASH', 'TRANSFER', 'POS', 'OTHER'] as PaymentMethod[]).map(method => {
                const isSelected = selectedMethod === method;
                return (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-xl)] border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-action-primary bg-action-primary/5 text-action-primary font-semibold'
                        : 'border-border-subtle bg-surface-default text-text-primary hover:border-border-default'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method}
                      {...register('method')}
                      className="w-4 h-4 text-action-primary border-border-subtle focus:ring-action-primary focus:ring-1"
                    />
                    <span className="text-sm">{PAYMENT_METHOD_LABELS[method]}</span>
                  </label>
                );
              })}
            </div>
            {errors.method && (
              <p className="text-xs text-status-danger-text font-medium">
                {errors.method.message}
              </p>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-action-primary hover:bg-action-primary-hover active:scale-[0.99] text-white font-semibold rounded-[var(--radius-xl)] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full h-10 text-text-secondary font-medium text-sm hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
