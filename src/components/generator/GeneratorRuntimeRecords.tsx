import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  TrendingUp,
  TimerReset,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Radio,
  ListFilter,
  CalendarDays,
} from 'lucide-react';
import {
  MonthlyRuntimeMetrics,
  GeneratorRuntimeSession,
  GeneratorStatus,
} from '../../types/generator';
import { formatDurationHHMMSS } from '../../services/runtimeCalculator';

interface GeneratorRuntimeRecordsProps {
  monthlyData: MonthlyRuntimeMetrics;
  status: GeneratorStatus;
  selectedYear: number;
  selectedMonthIndex: number;
  onMonthChange: (year: number, monthIndex: number) => void;
  onExportCSV: () => void;
  isLoading?: boolean;
}

export const GeneratorRuntimeRecords: React.FC<GeneratorRuntimeRecordsProps> = ({
  monthlyData,
  status,
  selectedYear,
  selectedMonthIndex,
  onMonthChange,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'detailed' | 'dailySummary'>('detailed');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'COMPLETED'>('ALL');
  const [liveRunningSeconds, setLiveRunningSeconds] = useState<number>(0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Active running timer: updates every 1 second if generator is currently ON
  const isRunning = status?.currentState === 'ON';

  useEffect(() => {
    if (isRunning && status.startedAt) {
      const updateLiveTimer = () => {
        const start = new Date(status.startedAt!).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        setLiveRunningSeconds(elapsed);
      };

      updateLiveTimer();
      const interval = setInterval(updateLiveTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveRunningSeconds(0);
    }
  }, [isRunning, status?.startedAt]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      onMonthChange(selectedYear - 1, 11);
    } else {
      onMonthChange(selectedYear, selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      onMonthChange(selectedYear + 1, 0);
    } else {
      onMonthChange(selectedYear, selectedMonthIndex + 1);
    }
  };

  // Compute live active sessions with dynamic runtime
  const liveSessions: GeneratorRuntimeSession[] = useMemo(() => {
    if (!monthlyData?.allSessions) return [];

    return monthlyData.allSessions.map((sess) => {
      if (sess.isOngoing || (sess.status === 'RUNNING' && isRunning)) {
        const dur = liveRunningSeconds > 0 ? liveRunningSeconds : sess.durationSeconds;
        return {
          ...sess,
          durationSeconds: dur,
          durationFormatted: formatDurationHHMMSS(dur),
          stopTimeLabel: 'Currently Running',
          status: 'RUNNING',
        };
      }
      return sess;
    });
  }, [monthlyData?.allSessions, isRunning, liveRunningSeconds]);

  // Dynamic monthly totals (including live ticking run)
  const dynamicTotalMonthlySeconds = useMemo(() => {
    if (!liveSessions) return 0;
    return liveSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  }, [liveSessions]);

  const dynamicTotalMonthlyFormatted = formatDurationHHMMSS(dynamicTotalMonthlySeconds);

  // Group detailed sessions by Date
  const groupedDetailedSessions = useMemo(() => {
    let filtered = liveSessions;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.dateLabel.toLowerCase().includes(q) ||
          s.startTimeLabel.toLowerCase().includes(q) ||
          s.stopTimeLabel.toLowerCase().includes(q) ||
          s.durationFormatted.includes(q)
      );
    }

    // Group by dateKey
    const groups: { [dateKey: string]: { dateLabel: string; sessions: GeneratorRuntimeSession[]; totalSeconds: number } } = {};

    filtered.forEach((sess) => {
      if (!groups[sess.dateKey]) {
        groups[sess.dateKey] = {
          dateLabel: sess.dateLabel,
          sessions: [],
          totalSeconds: 0,
        };
      }
      groups[sess.dateKey].sessions.push(sess);
      groups[sess.dateKey].totalSeconds += sess.durationSeconds;
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [liveSessions, statusFilter, searchTerm]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Month Selector */}
      <div className="industrial-card p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-wide flex items-center gap-2">
                  Generator Runtime Records
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold shadow-2xs">
                    EXACT HH:MM:SS
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Exact numerical generator operating sessions and runtime history.
                </p>
              </div>
            </div>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto select-none">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <select
                value={`${selectedYear}-${selectedMonthIndex}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  onMonthChange(y, m);
                }}
                className="bg-white border border-slate-300 text-slate-900 hover:border-slate-800 font-mono font-bold text-xs rounded-lg px-3.5 py-2 cursor-pointer focus:outline-none focus:border-slate-800 shadow-2xs transition-all"
              >
                {Array.from({ length: 3 }).map((_, yearOffset) => {
                  const yr = 2026 - yearOffset;
                  return monthNames.map((name, idx) => (
                    <option key={`${yr}-${idx}`} value={`${yr}-${idx}`} className="bg-white text-slate-900">
                      {name} {yr}
                    </option>
                  ));
                })}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Monthly Summary 5 Metric Cards - Parameter Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
          {/* MONTHLY RUNTIME - Emerald Highlight */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 relative overflow-hidden group shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 font-mono text-[11px] font-bold uppercase">
              <span>Monthly Runtime</span>
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-950 font-mono tracking-tight tabular-nums">
              {dynamicTotalMonthlyFormatted}
            </div>
            <p className="mt-1.5 text-[10px] text-emerald-700 leading-tight font-medium">
              Total runtime in {monthlyData?.monthLabel || 'this month'}
            </p>
          </div>

          {/* OPERATING DAYS - Blue Highlight */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between text-blue-800 font-mono text-[11px] font-bold uppercase">
              <span>Operating Days</span>
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-950 font-mono tracking-tight">
              {monthlyData?.operatingDaysCount || 0} <span className="text-xs font-semibold text-blue-700">Days</span>
            </div>
            <p className="mt-1.5 text-[10px] text-blue-700 leading-tight font-medium">
              Days generator operated
            </p>
          </div>

          {/* TOTAL STARTS - Purple Highlight */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 shadow-2xs">
            <div className="flex items-center justify-between text-purple-800 font-mono text-[11px] font-bold uppercase">
              <span>Total Starts</span>
              <Play className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-950 font-mono tracking-tight tabular-nums">
              {monthlyData?.totalStartsCount || 0}
            </div>
            <p className="mt-1.5 text-[10px] text-purple-700 leading-tight font-medium">
              ON events during month
            </p>
          </div>

          {/* AVERAGE RUNTIME - Amber Highlight */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 font-mono text-[11px] font-bold uppercase">
              <span>Average Runtime</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-950 font-mono tracking-tight tabular-nums">
              {monthlyData?.avgRuntimeFormatted || '00:00:00'}
            </div>
            <p className="mt-1.5 text-[10px] text-amber-700 leading-tight font-medium">
              Average per operating session
            </p>
          </div>

          {/* LONGEST RUN - Rose Highlight */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 col-span-2 sm:col-span-1 shadow-2xs">
            <div className="flex items-center justify-between text-rose-800 font-mono text-[11px] font-bold uppercase">
              <span>Longest Run</span>
              <TimerReset className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-950 font-mono tracking-tight tabular-nums">
              {monthlyData?.longestRuntimeFormatted || '00:00:00'}
            </div>
            <p className="mt-1.5 text-[10px] text-rose-700 leading-tight font-medium">
              Longest continuous run
            </p>
          </div>
        </div>

        {/* 3. Prominent Monthly Total Display Banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-slate-300 font-bold block">
                Total Generator Runtime ({monthlyData?.monthLabel || 'Selected Month'})
              </span>
              <span className="text-xs text-slate-400">
                Sum of all state-transition intervals in exact HH:MM:SS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight tabular-nums">
              {dynamicTotalMonthlyFormatted}
            </div>
            {isRunning && (
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                LIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Numerical Records Tables & Toolbar */}
      <div className="industrial-card p-5 space-y-4 bg-white border-slate-200 shadow-sm">
        {/* Toolbar: View Switcher, Search, Filter, Export CSV */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start shadow-2xs">
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daily Generator Runtime (Session Log)</span>
            </button>
            <button
              onClick={() => setViewMode('dailySummary')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'dailySummary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Daily Runtime Summary (All Days)</span>
            </button>
          </div>

          {/* Search, Status Filter & Export Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {viewMode === 'detailed' && (
              <>
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="ALL" className="bg-white text-slate-900">All Statuses</option>
                    <option value="RUNNING" className="bg-white text-emerald-700 font-bold">Running Only</option>
                    <option value="COMPLETED" className="bg-white text-slate-700">Completed Only</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by date / time..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 w-44 font-mono shadow-2xs"
                  />
                </div>
              </>
            )}

            <button
              onClick={onExportCSV}
              disabled={liveSessions.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export Runtime CSV</span>
            </button>
          </div>
        </div>

        {/* --- VIEW MODE 1: DETAILED SESSIONS WITH DAILY TOTALS --- */}
        {viewMode === 'detailed' && (
          <div className="space-y-6">
            {groupedDetailedSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-slate-800 font-bold text-sm">No generator operation recorded in {monthlyData?.monthLabel || 'this period'}.</p>
                <p className="text-[11px] text-slate-500">Total Runtime: 00:00:00 • Operating Days: 0 • Total Starts: 0</p>
              </div>
            ) : (
              groupedDetailedSessions.map((group) => (
                <div
                  key={group.dateLabel}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                >
                  {/* Date Group Header */}
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-700" />
                      <span className="font-bold text-slate-900 text-xs font-mono tracking-wide">
                        {group.dateLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-bold">
                        {group.sessions.length} {group.sessions.length === 1 ? 'Session' : 'Sessions'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 font-medium">Date Total:</span>
                      <span className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded tabular-nums">
                        {formatDurationHHMMSS(group.totalSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Sessions Table for this Date */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50/50">
                          <th className="py-2.5 px-4 font-semibold">Date</th>
                          <th className="py-2.5 px-4 font-semibold">Start Time</th>
                          <th className="py-2.5 px-4 font-semibold">Stop Time</th>
                          <th className="py-2.5 px-4 font-semibold text-slate-900">Runtime (HH:MM:SS)</th>
                          <th className="py-2.5 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.sessions.map((sess) => {
                          const isActivelyRunning = sess.status === 'RUNNING';

                          return (
                            <tr
                              key={sess.id}
                              className={`transition-colors ${
                                isActivelyRunning
                                  ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border-l-4 border-emerald-500'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Date */}
                              <td className="py-2.5 px-4 font-semibold text-slate-900">
                                {sess.dateLabel}
                              </td>

                              {/* Start Time */}
                              <td className="py-2.5 px-4 text-slate-700 font-medium">
                                {sess.startTimeLabel}
                              </td>

                              {/* Stop Time */}
                              <td className="py-2.5 px-4">
                                {isActivelyRunning ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                    </span>
                                    Currently Running
                                  </span>
                                ) : (
                                  <span className="text-slate-700">{sess.stopTimeLabel}</span>
                                )}
                              </td>

                              {/* Runtime HH:MM:SS - GREEN if active running */}
                              <td className="py-2.5 px-4">
                                <span
                                  className={`text-sm font-black tabular-nums ${
                                    isActivelyRunning ? 'text-emerald-700 animate-pulse' : 'text-slate-900'
                                  }`}
                                >
                                  {sess.durationFormatted}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-2.5 px-4">
                                {isActivelyRunning ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    <Radio className="w-3 h-3 animate-pulse text-emerald-700" />
                                    RUNNING
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                                    Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Highlighted Daily Total Bar */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      Daily Total ({group.dateLabel}):
                    </span>
                    <span className="text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-300 tabular-nums shadow-xs">
                      {formatDurationHHMMSS(group.totalSeconds)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- VIEW MODE 2: DAILY RUNTIME SUMMARY (ALL DAYS OF THE MONTH) --- */}
        {viewMode === 'dailySummary' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase bg-slate-50">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Day</th>
                  <th className="py-3 px-4 font-semibold">Sessions</th>
                  <th className="py-3 px-4 font-semibold text-slate-900">Total Runtime (HH:MM:SS)</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData?.dailySummaries?.map((day) => {
                  return (
                    <tr
                      key={day.dateKey}
                      className={`hover:bg-slate-50 transition-colors ${
                        day.hasOperation ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {day.dateLabel}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {day.dayOfWeek}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {day.sessionsCount > 0 ? (
                          <span className="font-bold text-slate-900">{day.sessionsCount}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-black tabular-nums text-sm ${
                            day.hasOperation ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {day.totalFormatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {day.hasOperation ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Operating ({day.sessionsCount} runs)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] text-slate-400 bg-slate-100 border border-slate-200">
                            No Operation
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
