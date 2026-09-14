import React, { useState } from 'react';
import { Calendar as CalendarIcon, X, Check, Clock } from 'lucide-react';
import { DateFilterRange, DateFilterType } from '../../types/generator';

interface PageHeaderProps {
  filter: DateFilterRange;
  onFilterChange: (newFilter: DateFilterRange) => void;
  generatorState?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  filter,
  onFilterChange,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSelectPreset = (type: DateFilterType) => {
    const now = new Date();
    if (type === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      onFilterChange({
        type: 'today',
        startDate: start.toISOString(),
        endDate: now.toISOString(),
        label: 'Today',
      });
    } else if (type === '7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      onFilterChange({
        type: '7days',
        startDate: start.toISOString(),
        endDate: now.toISOString(),
        label: 'Last 7 Days',
      });
    } else if (type === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      onFilterChange({
        type: '30days',
        startDate: start.toISOString(),
        endDate: now.toISOString(),
        label: 'Last 30 Days',
      });
    } else if (type === 'custom') {
      setShowCustomModal(true);
    }
  };

  const handleApplyCustom = () => {
    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T23:59:59`);

    if (start.getTime() > end.getTime()) {
      alert('Start Date cannot be later than End Date.');
      return;
    }

    const startFormatted = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const endFormatted = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    onFilterChange({
      type: 'custom',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `Custom (${startFormatted} - ${endFormatted})`,
    });
    setShowCustomModal(false);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Generator Monitoring
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs">
            TELEMETRY v2.4
          </span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
          Real-time generator runtime & power supply telemetry.
        </p>
      </div>

      {/* Date Range Selector Pill Buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-300 self-start md:self-auto shadow-xs">
        <button
          onClick={() => handleSelectPreset('today')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            filter.type === 'today'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleSelectPreset('7days')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            filter.type === '7days'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handleSelectPreset('30days')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            filter.type === '30days'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => handleSelectPreset('custom')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
            filter.type === 'custom'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{filter.type === 'custom' ? filter.label : 'Custom'}</span>
        </button>
      </div>

      {/* Custom Date Range Picker Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-300 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">Select Custom Date Range</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-700" />
                Telemetry Query Resolution
              </div>
              <p>
                Ranges under 48 hours will display hourly granularity. Ranges over 48 hours will be aggregated by day.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustom}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
