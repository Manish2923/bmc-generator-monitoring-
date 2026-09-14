import {
  GeneratorEvent,
  GeneratorReading,
  ActivityInterval,
  ChartDataPoint,
  RuntimeMetrics,
  GeneratorRuntimeSession,
  DailyRuntimeSummary,
  MonthlyRuntimeMetrics,
} from '../types/generator';

export interface RuntimeSession {
  id: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  isOngoing: boolean;
  startReadingId?: string;
  endReadingId?: string;
}

/**
 * Format duration strictly in standard industrial HH:MM:SS format.
 * Examples:
 * 0 -> 00:00:00
 * 59 -> 00:00:59
 * 60 -> 00:01:00
 * 61 -> 00:01:01
 * 3600 -> 01:00:00
 * 3661 -> 01:01:01
 * 10529 -> 02:55:29
 */
export function formatDurationHHMMSS(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    return '00:00:00';
  }

  const totalSec = Math.floor(seconds);
  const s = totalSec % 60;
  const m = Math.floor((totalSec / 60) % 60);
  const h = Math.floor(totalSec / 3600);

  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Legacy/Compact formatter for dashboard cards if needed.
 */
export function formatDuration(seconds: number, options?: { showSeconds?: boolean; compact?: boolean }): string {
  const showSec = options?.showSeconds ?? false;
  const compact = options?.compact ?? false;

  if (!seconds || isNaN(seconds) || seconds <= 0) {
    return showSec ? '00:00:00' : '0m';
  }

  if (showSec) {
    return formatDurationHHMMSS(seconds);
  }

  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const d = Math.floor(seconds / 86400);

  if (compact) {
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  if (d > 0) {
    return `${d}d ${h % 24}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h ${m}m ${s > 0 ? s + 's' : ''}`.trim();
  }
  return `${m}m ${s > 0 ? s + 's' : ''}`.trim();
}

/**
 * Reconstructs continuous runtime sessions from START and STOP events.
 * Handles active running sessions where STOP has not yet occurred.
 */
export function buildRuntimeSessions(
  events: GeneratorEvent[],
  currentState: 'ON' | 'OFF' | 'STARTING' | 'STOPPING' | 'FAULT' | 'UNKNOWN',
  currentTimestamp: Date = new Date()
): RuntimeSession[] {
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sessions: RuntimeSession[] = [];
  let pendingStart: GeneratorEvent | null = null;

  for (const ev of sorted) {
    if (ev.eventType === 'START') {
      if (pendingStart) {
        const startDt = new Date(pendingStart.timestamp);
        const endDt = new Date(ev.timestamp);
        const dur = Math.max(0, (endDt.getTime() - startDt.getTime()) / 1000);
        sessions.push({
          id: `session-${pendingStart.id}`,
          startTime: startDt,
          endTime: endDt,
          durationSeconds: dur,
          isOngoing: false,
          startReadingId: pendingStart.readingId,
        });
      }
      pendingStart = ev;
    } else if (ev.eventType === 'STOP' || ev.eventType === 'FAULT') {
      if (pendingStart) {
        const startDt = new Date(pendingStart.timestamp);
        const endDt = new Date(ev.timestamp);
        const dur = Math.max(0, (endDt.getTime() - startDt.getTime()) / 1000);
        sessions.push({
          id: `session-${pendingStart.id}-${ev.id}`,
          startTime: startDt,
          endTime: endDt,
          durationSeconds: dur,
          isOngoing: false,
          startReadingId: pendingStart.readingId,
          endReadingId: ev.readingId,
        });
        pendingStart = null;
      }
    }
  }

  // If generator is currently ON and there is an unclosed START event
  if (pendingStart && currentState === 'ON') {
    const startDt = new Date(pendingStart.timestamp);
    const endDt = currentTimestamp;
    const dur = Math.max(0, (endDt.getTime() - startDt.getTime()) / 1000);
    sessions.push({
      id: `session-active-${pendingStart.id}`,
      startTime: startDt,
      endTime: endDt,
      durationSeconds: dur,
      isOngoing: true,
      startReadingId: pendingStart.readingId,
    });
  }

  return sessions;
}

/**
 * Calculates exact runtime seconds within a specific time window [windowStart, windowEnd].
 */
export function calculateRuntimeInWindow(sessions: RuntimeSession[], windowStart: Date, windowEnd: Date): number {
  let totalSec = 0;
  const wStart = windowStart.getTime();
  const wEnd = windowEnd.getTime();

  for (const sess of sessions) {
    const sStart = sess.startTime.getTime();
    const sEnd = sess.endTime.getTime();

    const overlapStart = Math.max(sStart, wStart);
    const overlapEnd = Math.min(sEnd, wEnd);

    if (overlapEnd > overlapStart) {
      totalSec += (overlapEnd - overlapStart) / 1000;
    }
  }

  return Math.round(totalSec);
}

/**
 * Computes all runtime metrics for dashboard cards.
 */
export function computeRuntimeMetrics(
  sessions: RuntimeSession[],
  filterStart: Date,
  filterEnd: Date,
  now: Date = new Date()
): RuntimeMetrics {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = now;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayRuntimeSeconds = calculateRuntimeInWindow(sessions, startOfToday, endOfToday);
  const last7DaysRuntimeSeconds = calculateRuntimeInWindow(sessions, sevenDaysAgo, now);
  const last30DaysRuntimeSeconds = calculateRuntimeInWindow(sessions, thirtyDaysAgo, now);

  const totalRuntimeSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const selectedRangeRuntimeSeconds = calculateRuntimeInWindow(sessions, filterStart, filterEnd);

  const startsInRange = sessions.filter(
    (s) => s.startTime.getTime() >= filterStart.getTime() && s.startTime.getTime() <= filterEnd.getTime()
  );

  const totalStarts = startsInRange.length;
  const daysDiff = Math.max(1, Math.ceil((filterEnd.getTime() - filterStart.getTime()) / (24 * 60 * 60 * 1000)));
  const avgRuntimePerDaySeconds = Math.round(selectedRangeRuntimeSeconds / daysDiff);

  let longestRuntimeSeconds = 0;
  for (const s of startsInRange) {
    if (s.durationSeconds > longestRuntimeSeconds) {
      longestRuntimeSeconds = Math.round(s.durationSeconds);
    }
  }

  return {
    todayRuntimeSeconds,
    last7DaysRuntimeSeconds,
    last30DaysRuntimeSeconds,
    totalRuntimeSeconds,
    selectedRangeRuntimeSeconds,
    totalStarts,
    avgRuntimePerDaySeconds,
    longestRuntimeSeconds,
    lastUpdatedAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
  };
}

/**
 * Builds the comprehensive monthly runtime ledger for the "Generator Runtime Records" section.
 * - Parses raw START / STOP events.
 * - Handles midnight crossings by splitting sessions into discrete calendar dates.
 * - Formats times with seconds (e.g. "06:42:13 AM", "07:18:47 AM").
 * - Formats exact durations in HH:MM:SS.
 * - Constructs daily summaries for ALL days in the month (Day 1 to 30/31), including 0-runtime days.
 * - Computes total monthly runtime (HH:MM:SS), operating days, total starts, average runtime per session (HH:MM:SS), and longest run (HH:MM:SS).
 */
export function calculateMonthlyRuntimeLedger(
  events: GeneratorEvent[],
  currentState: 'ON' | 'OFF' | 'STARTING' | 'STOPPING' | 'FAULT' | 'UNKNOWN',
  year: number,
  monthIndex: number, // 0 = Jan, 8 = Sep
  currentTimestamp: Date = new Date(),
  bmcId: string = 'BMC-5780',
  generatorId: string = 'GEN-01'
): MonthlyRuntimeMetrics {
  const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthEnd = new Date(year, monthIndex, daysInMonth, 23, 59, 59, 999);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[monthIndex]} ${year}`;
  const monthKey = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;

  // 1. Build continuous sessions from raw events
  const rawSessions = buildRuntimeSessions(events, currentState, currentTimestamp);

  // 2. Split sessions across midnight boundaries into date-specific atomic sessions
  const atomicSessions: GeneratorRuntimeSession[] = [];

  for (const sess of rawSessions) {
    // Only process sessions that overlap with this month
    if (sess.endTime.getTime() < monthStart.getTime() || sess.startTime.getTime() > monthEnd.getTime()) {
      continue;
    }

    let cursor = new Date(sess.startTime);
    const sessionEnd = sess.endTime;

    while (cursor.getTime() < sessionEnd.getTime()) {
      const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999);

      const segmentStart = new Date(Math.max(cursor.getTime(), dayStart.getTime()));
      const segmentEnd = new Date(Math.min(sessionEnd.getTime(), dayEnd.getTime()));

      const durationSec = Math.max(0, Math.round((segmentEnd.getTime() - segmentStart.getTime()) / 1000));

      if (durationSec > 0 || sess.isOngoing) {
        // Format labels
        const dateKey = `${segmentStart.getFullYear()}-${(segmentStart.getMonth() + 1).toString().padStart(2, '0')}-${segmentStart.getDate().toString().padStart(2, '0')}`;
        const dateLabel = segmentStart.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const startTimeLabel = segmentStart.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        const isActivelyRunning = sess.isOngoing && segmentEnd.getTime() >= currentTimestamp.getTime() - 2000;
        const stopTimeLabel = isActivelyRunning
          ? 'Currently Running'
          : segmentEnd.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });

        atomicSessions.push({
          id: `${sess.id}-${dateKey}`,
          bmcId,
          generatorId,
          dateKey,
          dateLabel,
          startTime: segmentStart.toISOString(),
          stopTime: isActivelyRunning ? undefined : segmentEnd.toISOString(),
          startTimeLabel,
          stopTimeLabel,
          durationSeconds: durationSec,
          durationFormatted: formatDurationHHMMSS(durationSec),
          status: isActivelyRunning ? 'RUNNING' : 'COMPLETED',
          startReadingId: sess.startReadingId,
          stopReadingId: sess.endReadingId,
          isOngoing: isActivelyRunning,
        });
      }

      // Advance cursor to next day 00:00:00
      cursor = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // 3. Build Daily Summaries for every calendar day (1 to daysInMonth)
  const dailySummaries: DailyRuntimeSummary[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, monthIndex, day, 12, 0, 0);
    const dateKey = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dateLabel = dayDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

    // Find all sessions belonging to this date
    const daySessions = atomicSessions.filter((s) => s.dateKey === dateKey);
    const totalSeconds = daySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    dailySummaries.push({
      dateKey,
      dateLabel,
      dayOfWeek,
      dayNumber: day,
      sessionsCount: daySessions.length,
      totalSeconds,
      totalFormatted: formatDurationHHMMSS(totalSeconds),
      hasOperation: daySessions.length > 0 && totalSeconds > 0,
      sessions: daySessions,
    });
  }

  // 4. Calculate Monthly Aggregate Metrics
  const totalSeconds = atomicSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const operatingDaysCount = dailySummaries.filter((d) => d.hasOperation).length;
  const totalStartsCount = atomicSessions.length;
  const avgRuntimePerSessionSeconds = totalStartsCount > 0 ? Math.round(totalSeconds / totalStartsCount) : 0;

  let longestRuntimeSeconds = 0;
  for (const s of atomicSessions) {
    if (s.durationSeconds > longestRuntimeSeconds) {
      longestRuntimeSeconds = s.durationSeconds;
    }
  }

  return {
    monthKey,
    monthLabel,
    monthIndex,
    year,
    totalSeconds,
    totalFormatted: formatDurationHHMMSS(totalSeconds),
    operatingDaysCount,
    totalStartsCount,
    avgRuntimePerSessionSeconds,
    avgRuntimeFormatted: formatDurationHHMMSS(avgRuntimePerSessionSeconds),
    longestRuntimeSeconds,
    longestRuntimeFormatted: formatDurationHHMMSS(longestRuntimeSeconds),
    dailySummaries,
    allSessions: atomicSessions,
  };
}

/**
 * Builds chart data grouped by hour for 'today' or grouped by day for multi-day ranges.
 */
export function generateChartData(
  sessions: RuntimeSession[],
  readings: GeneratorReading[],
  filterType: 'today' | '7days' | '30days' | 'custom',
  filterStart: Date,
  filterEnd: Date
): ChartDataPoint[] {
  const isHourly = filterType === 'today' || (filterEnd.getTime() - filterStart.getTime() <= 24 * 60 * 60 * 1000);

  if (isHourly) {
    const points: ChartDataPoint[] = [];
    const baseDate = new Date(filterStart);
    baseDate.setMinutes(0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const bucketStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, 0, 0);
      const bucketEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, 59, 59, 999);

      const sec = calculateRuntimeInWindow(sessions, bucketStart, bucketEnd);
      const min = Math.round((sec / 60) * 10) / 10;

      const hourReadings = readings.filter((r) => {
        const t = new Date(r.timestamp).getTime();
        return t >= bucketStart.getTime() && t <= bucketEnd.getTime();
      });

      const avgVib = hourReadings.length > 0
        ? Number((hourReadings.reduce((sum, r) => sum + r.vibrationReading, 0) / hourReadings.length).toFixed(4))
        : 0;

      const peakVib = hourReadings.length > 0
        ? Number(Math.max(...hourReadings.map(r => r.vibrationReading)).toFixed(4))
        : 0;

      const starts = sessions.filter(
        (s) => s.startTime.getTime() >= bucketStart.getTime() && s.startTime.getTime() <= bucketEnd.getTime()
      ).length;

      const hourLabel = bucketStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

      points.push({
        timestamp: bucketStart.toISOString(),
        label: hourLabel,
        runtimeMinutes: min,
        runtimeFormatted: `${min}m`,
        startsCount: starts,
        avgVibration: avgVib,
        peakVibration: peakVib,
      });
    }
    return points;
  }

  const points: ChartDataPoint[] = [];
  const curr = new Date(filterStart);
  curr.setHours(0, 0, 0, 0);

  const end = new Date(filterEnd);
  end.setHours(23, 59, 59, 999);

  while (curr.getTime() <= end.getTime()) {
    const bucketStart = new Date(curr);
    const bucketEnd = new Date(curr);
    bucketEnd.setHours(23, 59, 59, 999);

    const sec = calculateRuntimeInWindow(sessions, bucketStart, bucketEnd);
    const min = Math.round((sec / 60) * 10) / 10;

    const dayReadings = readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= bucketStart.getTime() && t <= bucketEnd.getTime();
    });

    const avgVib = dayReadings.length > 0
      ? Number((dayReadings.reduce((sum, r) => sum + r.vibrationReading, 0) / dayReadings.length).toFixed(4))
      : 0;

    const peakVib = dayReadings.length > 0
      ? Number(Math.max(...dayReadings.map(r => r.vibrationReading)).toFixed(4))
      : 0;

    const starts = sessions.filter(
      (s) => s.startTime.getTime() >= bucketStart.getTime() && s.startTime.getTime() <= bucketEnd.getTime()
    ).length;

    const dayLabel = bucketStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    points.push({
      timestamp: bucketStart.toISOString(),
      label: dayLabel,
      runtimeMinutes: min,
      runtimeFormatted: `${min}m`,
      startsCount: starts,
      avgVibration: avgVib,
      peakVibration: peakVib,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return points;
}

/**
 * Builds continuous ON/OFF/FAULT timeline intervals for the Generator Activity strip chart.
 */
export function buildActivityTimelineIntervals(
  sessions: RuntimeSession[],
  events: GeneratorEvent[],
  filterStart: Date,
  filterEnd: Date
): ActivityInterval[] {
  const intervals: ActivityInterval[] = [];

  const relevantSessions = sessions.filter(
    (s) => s.endTime.getTime() >= filterStart.getTime() && s.startTime.getTime() <= filterEnd.getTime()
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (relevantSessions.length === 0) {
    const durSec = Math.max(0, (filterEnd.getTime() - filterStart.getTime()) / 1000);
    intervals.push({
      id: 'idle-full-window',
      state: 'OFF',
      startTime: filterStart.toISOString(),
      endTime: filterEnd.toISOString(),
      durationSeconds: durSec,
      durationFormatted: formatDurationHHMMSS(durSec),
      avgVibration: 0.024,
      startsAtLabel: filterStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      endsAtLabel: filterEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });
    return intervals;
  }

  let cursor = new Date(Math.max(filterStart.getTime(), relevantSessions[0].startTime.getTime() - 4 * 3600 * 1000));

  for (let i = 0; i < relevantSessions.length; i++) {
    const s = relevantSessions[i];

    if (s.startTime.getTime() > cursor.getTime()) {
      const offDur = (s.startTime.getTime() - cursor.getTime()) / 1000;
      if (offDur > 60) {
        intervals.push({
          id: `off-${cursor.getTime()}`,
          state: 'OFF',
          startTime: cursor.toISOString(),
          endTime: s.startTime.toISOString(),
          durationSeconds: Math.round(offDur),
          durationFormatted: formatDurationHHMMSS(offDur),
          avgVibration: 0.025,
          startsAtLabel: cursor.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endsAtLabel: s.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        });
      }
    }

    const dur = s.durationSeconds;
    intervals.push({
      id: s.id,
      state: 'ON',
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      durationSeconds: Math.round(dur),
      durationFormatted: formatDurationHHMMSS(dur),
      avgVibration: 1.84,
      startsAtLabel: s.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      endsAtLabel: s.isOngoing
        ? 'Active (Now)'
        : s.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });

    cursor = s.endTime;
  }

  return intervals;
}
