import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReturnPackageSheet } from './ReturnPackageSheet';
import { CancelPackageSheet } from './CancelPackageSheet';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

describe('Return and Cancel Sheets', () => {
  const mockPackage: LocalPackage = {
    id: 'pkg-sheet-1',
    business_id: 1,
    pickup_point_id: null,
    customer_id: 'cust-1',
    public_package_id: 'PD-8K42Q',
    pickup_code: '7K4P2MX',
    amount_due_minor: 350000,
    status: 'WAITING',
    client_created_at: new Date().toISOString(),
    server_received_at: null,
    version: 1,
    sync_status: 'SYNCED',
  };

  const mockCustomer: LocalCustomer = {
    id: 'cust-1',
    business_id: 1,
    name: 'Chinedu Okafor',
    phone_display: '0803 123 4567',
    phone_normalized: '+2348031234567',
    version: 1,
    sync_status: 'SYNCED',
  };

  const emptyPaymentSummary: PaymentSummaryData = {
    amountDueMinor: 350000,
    paidMinor: 0,
    balanceMinor: 350000,
    paymentState: 'UNPAID',
    isFullyPaid: false,
    paymentCount: 0,
  };

  const paidPaymentSummary: PaymentSummaryData = {
    amountDueMinor: 350000,
    paidMinor: 350000,
    balanceMinor: 0,
    paymentState: 'PAID',
    isFullyPaid: true,
    paymentCount: 1,
  };

  it('renders ReturnPackageSheet and validates reason selection', async () => {
    const onConfirmReturn = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ReturnPackageSheet
        isOpen={true}
        onClose={onClose}
        pkg={mockPackage}
        customer={mockCustomer}
        paymentSummary={emptyPaymentSummary}
        onConfirmReturn={onConfirmReturn}
      />
    );

    expect(screen.getByText('Return package')).toBeDefined();
    expect(screen.getByText('Chinedu Okafor')).toBeDefined();
    expect(screen.getByText('PD-8K42Q')).toBeDefined();

    // Select "Customer did not collect"
    const radio = screen.getByLabelText('Customer did not collect');
    fireEvent.click(radio);

    // Click Confirm return
    const submitBtn = screen.getByRole('button', { name: /Confirm return/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmReturn).toHaveBeenCalledWith('CUSTOMER_DID_NOT_COLLECT', null);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('requires note when OTHER is selected in ReturnPackageSheet', async () => {
    const onConfirmReturn = vi.fn().mockResolvedValue(undefined);

    render(
      <ReturnPackageSheet
        isOpen={true}
        onClose={vi.fn()}
        pkg={mockPackage}
        customer={mockCustomer}
        paymentSummary={emptyPaymentSummary}
        onConfirmReturn={onConfirmReturn}
      />
    );

    // Select "Other"
    fireEvent.click(screen.getByLabelText('Other'));

    // Try to submit without typing note
    const submitBtn = screen.getByRole('button', { name: /Confirm return/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please provide a reason note')).toBeDefined();
    expect(onConfirmReturn).not.toHaveBeenCalled();

    // Type note
    const textarea = screen.getByPlaceholderText(/Explain why this action is being taken/i);
    fireEvent.change(textarea, { target: { value: 'Customer relocated permanently' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmReturn).toHaveBeenCalledWith('OTHER', 'Customer relocated permanently');
    });
  });

  it('renders ExistingPaymentWarning when payments exist on CancelPackageSheet', async () => {
    render(
      <CancelPackageSheet
        isOpen={true}
        onClose={vi.fn()}
        pkg={mockPackage}
        customer={mockCustomer}
        paymentSummary={paidPaymentSummary}
        onConfirmCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Payment of ₦3,500 already recorded/i)).toBeDefined();
    expect(screen.getByText(/will not alter or refund recorded payment history/i)).toBeDefined();
  });
});
