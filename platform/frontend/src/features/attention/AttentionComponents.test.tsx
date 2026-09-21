import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttentionItemRow } from './components/AttentionItemRow';
import { AttentionEmptyState } from './components/AttentionEmptyState';
import { AttentionSummary } from './components/AttentionSummary';
import type { AttentionItem } from './attention-types';

describe('Attention Components', () => {
  const mockItem: AttentionItem = {
    id: 'photo-upload:123',
    type: 'PHOTO_UPLOAD_FAILED',
    severity: 'ERROR',
    title: "Package photo couldn't upload",
    message: 'Network timed out during upload to storage.',
    entityType: 'package',
    entityId: 'pkg-123',
    occurredAt: new Date().toISOString(),
    action: {
      type: 'RETRY_PHOTO',
      label: 'Retry upload',
      requiresOnline: true,
    },
    metadata: {
      publicPackageId: 'PD-8K42Q',
      customerName: 'Chinedu Okafor',
    },
  };

  describe('AttentionItemRow', () => {
    it('renders title, context identity, message, and action', () => {
      const handleAction = vi.fn();
      render(<AttentionItemRow item={mockItem} onAction={handleAction} />);

      expect(screen.getByText("Package photo couldn't upload")).toBeInTheDocument();
      expect(screen.getByText('PD-8K42Q')).toBeInTheDocument();
      expect(screen.getByText('Chinedu Okafor')).toBeInTheDocument();
      expect(screen.getByText('Network timed out during upload to storage.')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /retry upload/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledWith(mockItem);
    });

    it('disables action requiring online connection when offline', () => {
      render(<AttentionItemRow item={mockItem} isOffline={true} />);

      const btn = screen.getByRole('button', { name: /connect to internet/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });

  describe('AttentionEmptyState', () => {
    it('renders calm caught-up message', () => {
      render(<AttentionEmptyState />);
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      expect(screen.getByText(/successful operations remain quiet/i)).toBeInTheDocument();
    });
  });

  describe('AttentionSummary', () => {
    it('returns null when items list is empty', () => {
      const { container } = render(<AttentionSummary items={[]} onViewAll={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders preview items and view all trigger when items exist', () => {
      const handleViewAll = vi.fn();
      render(<AttentionSummary items={[mockItem]} onViewAll={handleViewAll} />);

      expect(screen.getByText('Needs attention (1)')).toBeInTheDocument();
      expect(screen.getByText("Package photo couldn't upload")).toBeInTheDocument();
      expect(screen.getByText(/· PD-8K42Q/i)).toBeInTheDocument();

      const viewAllBtn = screen.getByRole('button', { name: /view all/i });
      fireEvent.click(viewAllBtn);
      expect(handleViewAll).toHaveBeenCalledTimes(1);
    });
  });
});
