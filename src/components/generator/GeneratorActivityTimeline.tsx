import React from 'react';
import { Layers, Zap, AlertTriangle } from 'lucide-react';
import { ActivityInterval } from '../../types/generator';

interface GeneratorActivityTimelineProps {
  intervals: ActivityInterval[];
  isLoading?: boolean;
}

export const GeneratorActivityTimeline: React.FC<GeneratorActivityTimelineProps> = ({
  intervals,
  isLoading,
}) => {
  const totalWindowDuration = intervals.reduce((sum, item) => sum + item.durationSeconds, 0) || 1;

  return (
    <div className="industrial-card p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              Generator Activity
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Operational state timeline and duty cycles across the selected period.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-emerald-500 shadow-green-glow"></span>
            <span className="text-emerald-800 font-bold">ON (Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-slate-200 border border-slate-300"></span>
            <span className="text-slate-600">OFF (Standby)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm bg-rose-500"></span>
            <span className="text-rose-700 font-bold">FAULT</span>
          </div>
        </div>
      </div>

      {/* Horizontal Strip Visualizer */}
      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="h-12 flex items-center justify-center text-slate-400 text-xs font-mono">
            Loading activity intervals...
          </div>
        ) : intervals.length === 0 ? (
          <div className="h-12 flex items-center justify-center text-slate-400 text-xs">
            No activity intervals in this timeframe.
          </div>
        ) : (
          <div>
            {/* Visual strip bar */}
            <div className="h-10 w-full rounded-lg bg-slate-100 border border-slate-300 flex overflow-hidden p-1 gap-0.5 shadow-inner">
              {intervals.map((interval) => {
                const widthPercent = Math.max(
                  2,
                  Math.min(100, (interval.durationSeconds / totalWindowDuration) * 100)
                );

                const isOn = interval.state === 'ON';
                const isFault = interval.state === 'FAULT';

                return (
                  <div
                    key={interval.id}
                    style={{ width: `${widthPercent}%` }}
                    title={`${interval.state}: ${interval.startsAtLabel} ➔ ${interval.endsAtLabel} (${interval.durationFormatted})`}
                    className={`h-full rounded transition-all cursor-pointer relative group flex items-center justify-center ${
                      isOn
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-xs'
                        : isFault
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {isOn && widthPercent > 8 && (
                      <span className="text-[10px] font-black text-white font-mono tracking-tight flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-white" />
                        {interval.durationFormatted}
                      </span>
                    )}

                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-white border border-slate-300 px-2.5 py-1.5 rounded-lg shadow-xl text-[11px] font-mono z-20 whitespace-nowrap pointer-events-none">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOn ? 'bg-emerald-500' : isFault ? 'bg-rose-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="text-slate-900">{interval.state}</span>
                        <span className="text-emerald-700">({interval.durationFormatted})</span>
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {interval.startsAtLabel} ➔ {interval.endsAtLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interval summary cards below bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3.5">
              {intervals
                .filter((i) => i.state === 'ON' || i.state === 'FAULT')
                .slice(-4)
                .map((session) => (
                  <div
                    key={session.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center ${
                          session.state === 'ON'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {session.state === 'ON' ? (
                          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-[11px]">
                          {session.startsAtLabel} - {session.endsAtLabel}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Avg Vib: <span className="font-semibold text-amber-700">{session.avgVibration} m/s²</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {session.durationFormatted}
                    </span>
                  </div>
                ))}
              {intervals.filter((i) => i.state === 'ON').length === 0 && (
                <div className="col-span-full py-2 text-center text-xs text-slate-400 font-mono">
                  No active operational runs during this period.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
