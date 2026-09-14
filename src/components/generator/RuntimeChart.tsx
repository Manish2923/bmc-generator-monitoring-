import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ChartDataPoint } from '../../types/generator';

interface RuntimeChartProps {
  data: ChartDataPoint[];
  filterType: string;
  isLoading?: boolean;
}

export const RuntimeChart: React.FC<RuntimeChartProps> = ({
  data,
  filterType,
  isLoading = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isHourly = filterType === 'today';

  // Custom Light Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData: ChartDataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-slate-300 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[160px]">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              {isHourly ? 'Hourly Bucket' : 'Daily Bucket'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Operating Duration:</span>
            <span className="font-mono font-bold text-emerald-700">
              {pData.runtimeMinutes} mins
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Generator Starts:</span>
            <span className="font-mono font-bold text-blue-700">
              {pData.startsCount}
            </span>
          </div>
          {pData.avgVibration > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Avg Vibration:</span>
              <span className="font-mono text-amber-700 font-bold">
                {pData.avgVibration.toFixed(4)} m/s²
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="industrial-card p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
                Runtime Trend
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
                  Visual Summary
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Graphical duty cycle curve over the selected period.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            {isHourly ? 'Resolution: Hourly' : 'Resolution: Daily'}
          </span>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title={collapsed ? 'Expand Graph' : 'Collapse Graph'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart container */}
      {!collapsed && (
        <div className="mt-4 animate-fade-in">
          <div className="h-56 sm:h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                Loading telemetry series...
              </div>
            ) : !data || data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <p className="text-xs">No generator runtime recorded for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldGradientTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontFamily: 'Inter' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(v) => `${v}m`}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="runtimeMinutes"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#emeraldGradientTrend)"
                    activeDot={{
                      r: 5,
                      fill: '#15803d',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700">Runtime curve (Operating Minutes)</span>
            </span>
            <span>Secondary visual trend to numerical ledger above</span>
          </div>
        </div>
      )}
    </div>
  );
};
