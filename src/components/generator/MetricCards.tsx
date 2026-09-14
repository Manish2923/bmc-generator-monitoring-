import React, { useState, useEffect } from 'react';
import {
  Clock,
  CalendarDays,
  Gauge,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { GeneratorStatus, RuntimeMetrics } from '../../types/generator';
import { formatDuration } from '../../services/runtimeCalculator';

interface MetricCardsProps {
  status: GeneratorStatus;
  metrics: RuntimeMetrics;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ status, metrics }) => {
  const [liveRuntimeSec, setLiveRuntimeSec] = useState<number>(status.currentRuntimeSeconds || 0);

  useEffect(() => {
    if (status.currentState === 'ON' && status.startedAt) {
      const calculateSeconds = () => {
        const start = new Date(status.startedAt!).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setLiveRuntimeSec(diff);
      };

      calculateSeconds();
      const interval = setInterval(calculateSeconds, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveRuntimeSec(0);
    }
  }, [status.currentState, status.startedAt]);

  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return '--:-- --';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const isRunning = status?.currentState === 'ON';
  const isFault = status?.currentState === 'FAULT';

  const dynamicTodaySeconds = isRunning
    ? (metrics?.todayRuntimeSeconds || 0) + liveRuntimeSec
    : (metrics?.todayRuntimeSeconds || 0);

  const dynamicTotalSeconds = isRunning
    ? (metrics?.totalRuntimeSeconds || 0) + liveRuntimeSec
    : (metrics?.totalRuntimeSeconds || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Current Status - GREEN when ON, RED when OFF */}
      <div
        className={`industrial-card p-5 relative overflow-hidden transition-all duration-300 ${
          isRunning
            ? 'bg-emerald-50/70 border-emerald-300 shadow-green-glow'
            : isFault
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-rose-50/70 border-rose-300 shadow-red-glow'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-bold uppercase tracking-wider font-mono ${
              isRunning ? 'text-emerald-800' : isFault ? 'text-amber-800' : 'text-rose-800'
            }`}
          >
            Current Status
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs ${
              isRunning
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700 animate-pulse'
                : isFault
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'bg-rose-100 border-rose-300 text-rose-700'
            }`}
          >
            {isRunning ? (
              <PlayCircle className="w-5 h-5 text-emerald-700 fill-emerald-200" />
            ) : isFault ? (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            ) : (
              <StopCircle className="w-5 h-5 text-rose-700 fill-rose-200" />
            )}
          </div>
        </div>

        {/* Status Value */}
        <div className="mt-3 flex items-baseline gap-2">
          {isRunning ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                Running (ON)
              </span>
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
              </span>
            </div>
          ) : isFault ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black text-amber-700 tracking-tight">
                Fault
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black text-rose-700 tracking-tight">
                Stopped (OFF)
              </span>
              <span className="h-3 w-3 rounded-full bg-rose-500"></span>
            </div>
          )}
        </div>

        {/* Sub-metrics */}
        <div
          className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
            isRunning ? 'border-emerald-200/80' : 'border-rose-200/80'
          }`}
        >
          {isRunning ? (
            <>
              <div>
                <span className="text-emerald-800 block text-[10px] font-medium">Started At:</span>
                <span className="text-emerald-950 font-bold">{formatTimeOnly(status.startedAt)}</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-800 block text-[10px] font-medium">Live Run Duration:</span>
                <span className="text-emerald-700 font-black text-sm tabular-nums flex items-center gap-0.5 justify-end">
                  <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  {formatDuration(liveRuntimeSec, { showSeconds: true })}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-rose-800 block text-[10px] font-medium">Vibration (Standby):</span>
                <span className="text-rose-950 font-bold tabular-nums">
                  {status.latestReading?.vibrationReading !== undefined
                    ? `${status.latestReading.vibrationReading.toFixed(4)} m/s²`
                    : '0.0276 m/s²'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-rose-800 block text-[10px] font-medium">Stopped At:</span>
                <span className="text-rose-950 font-bold">{formatTimeOnly(status.stoppedAt)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CARD 2: Today's Runtime - Green highlight when generator active */}
      <div className="industrial-card p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">
            Today's Runtime
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-black tracking-tight tabular-nums ${
              isRunning ? 'text-emerald-700' : 'text-indigo-950'
            }`}
          >
            {formatDuration(dynamicTodaySeconds, { compact: true })}
          </span>
          {isRunning && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 animate-pulse font-bold">
              +LIVE
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Today's Total Time</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {formatDuration(dynamicTodaySeconds, { showSeconds: true })}
          </span>
        </div>
      </div>

      {/* CARD 3: Last 7 Days Runtime - Blue Highlight */}
      <div className="industrial-card p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider font-mono">
            Last 7 Days
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-blue-950 tracking-tight tabular-nums">
            {formatDuration(metrics.last7DaysRuntimeSeconds, { compact: true })}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">7-Day Aggregated Run</span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold px-2 py-0.5 rounded">
            {formatDuration(metrics.last7DaysRuntimeSeconds, { showSeconds: false })}
          </span>
        </div>
      </div>

      {/* CARD 4: Total Runtime - Amber Highlight */}
      <div className="industrial-card p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
            Total Runtime
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-950 tracking-tight tabular-nums">
            {formatDuration(dynamicTotalSeconds, { compact: true })}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">All-time Cumulative</span>
          <span className="bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold px-2 py-0.5 rounded">
            {formatDuration(dynamicTotalSeconds, { showSeconds: false })}
          </span>
        </div>
      </div>
    </div>
  );
};
