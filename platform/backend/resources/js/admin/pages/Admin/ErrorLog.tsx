import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Clock,
  CheckCircle2,
  RotateCw
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface LogEntry {
  id: string;
  timestamp: string;
  environment: string;
  level: string;
  message: string;
  stackTrace: string;
}

interface ErrorLogProps {
  errors: LogEntry[];
}

export default function ErrorLog({ errors: initialErrors }: ErrorLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialErrors || []);
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ERROR');
  const [isPaused, setIsPaused] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Polling stream every 3 seconds per spec §6.8
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      fetch('/admin/error-log/stream', {
        headers: { Accept: 'application/json' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.errors) {
            setLogs(data.errors);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearLog = () => {
    setIsClearing(true);
    router.post('/admin/error-log/clear', {}, {
      onSuccess: () => {
        setLogs([]);
        setClearDialogOpen(false);
        setIsClearing(false);
      },
      onError: () => setIsClearing(false),
    });
  };

  const filteredLogs = logs.filter((entry) => {
    if (filter === 'ALL') return true;
    if (filter === 'ERROR') return entry.level === 'ERROR' || entry.level === 'CRITICAL' || entry.level === 'EMERGENCY';
    if (filter === 'WARNING') return entry.level === 'WARNING';
    if (filter === 'INFO') return entry.level === 'INFO' || entry.level === 'NOTICE';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Error Log</h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Real-time stream of backend exceptions and system warnings from storage/logs/laravel.log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-xs ${
              isPaused
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-600" /> : <Pause className="w-3.5 h-3.5 text-[#64748B]" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          {/* Clear Log Button */}
          <button
            type="button"
            onClick={() => setClearDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-[#DC2626] border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR — Spec §6.8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-xl w-fit">
          {[
            { id: 'ERROR', label: 'Errors' },
            { id: 'WARNING', label: 'Warnings' },
            { id: 'INFO', label: 'Info' },
            { id: 'ALL', label: 'All Entries' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>laravel.log · Auto-refresh 3s · {filteredLogs.length} entries</span>
        </div>
      </div>

      {/* LOG ENTRIES STREAM CONTAINER — Spec §6.8: max-height ~70vh, expand/collapse */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs divide-y divide-[#F1F5F9] max-h-[70vh] overflow-y-auto"
      >
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((err) => {
            const isExpanded = expandedIds.has(err.id);
            const isError = err.level === 'ERROR' || err.level === 'CRITICAL' || err.level === 'EMERGENCY';
            const isWarning = err.level === 'WARNING';

            return (
              <div
                key={err.id}
                className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                onClick={() => toggleExpand(err.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Level indicator dot and label */}
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isError ? 'bg-[#DC2626]' : isWarning ? 'bg-[#D97706]' : 'bg-[#2563EB]'
                        }`}
                      />
                      <span
                        className={`font-mono font-bold text-xs ${
                          isError ? 'text-[#DC2626]' : isWarning ? 'text-[#D97706]' : 'text-[#2563EB]'
                        }`}
                      >
                        {err.level}
                      </span>
                    </div>

                    {/* Message snippet */}
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-[#0F172A] break-words">
                        {isExpanded ? err.message : `${err.message.substring(0, 180)}${err.message.length > 180 ? '...' : ''}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs text-[#94A3B8] font-mono">
                    <span className="hidden sm:inline">{err.timestamp}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>

                {/* Collapsible Stack Trace */}
                {isExpanded && err.stackTrace && (
                  <div
                    className="mt-3 p-3 rounded-xl bg-[#0F172A] text-slate-200 font-mono text-xs overflow-x-auto max-h-64 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[#64748B] text-[11px] mb-1 font-sans font-semibold uppercase tracking-wider">
                      Stack Trace
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">{err.stackTrace}</pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#0F172A]">No log entries matching filter</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              The application log is healthy and clear of unhandled exceptions.
            </p>
          </div>
        )}
      </div>

      {/* CLEAR LOG CONFIRMATION DIALOG — Spec §6.8 */}
      <Dialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear Application Error Log?"
        description="This action truncates storage/logs/laravel.log to 0 bytes. Historical exceptions will be permanently cleared."
      >
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => setClearDialogOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClearLog}
            disabled={isClearing}
            className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] disabled:opacity-50"
          >
            {isClearing ? 'Clearing...' : 'Confirm Clear Log'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
