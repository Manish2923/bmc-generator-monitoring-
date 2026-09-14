import React from 'react';
import {
  Calendar,
  Clock,
  Play,
  TrendingUp,
  TimerReset,
  RefreshCw,
} from 'lucide-react';
import { DateFilterRange, RuntimeMetrics } from '../../types/generator';
import { formatDuration } from '../../services/runtimeCalculator';

interface SelectedRangeSummaryProps {
  filter: DateFilterRange;
  metrics: RuntimeMetrics;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const SelectedRangeSummary: React.FC<SelectedRangeSummaryProps> = ({
  filter,
  metrics,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="industrial-card p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900 tracking-wide">
            Selected Range Summary
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">
            Last Updated: <span className="text-slate-900 font-bold">{metrics?.lastUpdatedAt || '--:--:--'}</span>
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh telemetry"
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-900' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
        {/* Selected Range */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block font-mono">
            Selected Range
          </span>
          <span className="text-sm font-black text-slate-900 mt-1 block truncate">
            {filter?.label || 'Today'}
          </span>
        </div>

        {/* Total Range Runtime - Blue Highlight */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            Total Range Runtime
          </span>
          <span className="text-base font-black text-blue-950 mt-1 block font-mono tabular-nums">
            {formatDuration(metrics?.selectedRangeRuntimeSeconds || 0, { compact: false })}
          </span>
        </div>

        {/* Total Generator Starts - Emerald Highlight */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block font-mono flex items-center gap-1">
            <Play className="w-3 h-3 text-emerald-600" />
            Total Starts
          </span>
          <span className="text-base font-black text-emerald-950 mt-1 block font-mono tabular-nums">
            {metrics?.totalStarts || 0} <span className="text-xs font-semibold text-emerald-700">starts</span>
          </span>
        </div>

        {/* Average Runtime / Day - Purple Highlight */}
        <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-700 block font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-600" />
            Average Runtime / Day
          </span>
          <span className="text-base font-black text-purple-950 mt-1 block font-mono tabular-nums">
            {formatDuration(metrics?.avgRuntimePerDaySeconds || 0, { showSeconds: true })}
          </span>
        </div>

        {/* Longest Runtime - Amber Highlight */}
        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 col-span-2 sm:col-span-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 block font-mono flex items-center gap-1">
            <TimerReset className="w-3 h-3 text-amber-600" />
            Longest Runtime
          </span>
          <span className="text-base font-black text-amber-950 mt-1 block font-mono tabular-nums">
            {formatDuration(metrics?.longestRuntimeSeconds || 0, { showSeconds: true })}
          </span>
        </div>
      </div>
    </div>
  );
};
