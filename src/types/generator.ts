export type GeneratorState = 'ON' | 'OFF' | 'STARTING' | 'STOPPING' | 'FAULT' | 'UNKNOWN';

export type GeneratorEventType = 'START' | 'STOP' | 'FAULT' | 'RECOVERY';

export type DeviceConnectionStatus = 'LIVE' | 'OFFLINE' | 'DEGRADED';

export interface GeneratorReading {
  id: string;
  bmcId: string;
  generatorId: string;
  timestamp: string; // ISO string
  generatorState: GeneratorState;
  vibrationReading: number; // e.g. 0.0276
  voltage?: number; // e.g. 230.5 V
  current?: number; // e.g. 18.4 A
  power?: number; // e.g. 4.2 kW
  frequency?: number; // e.g. 50.1 Hz
  fuelLevel?: number; // e.g. 74 %
  source?: string;
  createdAt: string;
}

export interface GeneratorEvent {
  id: string;
  bmcId: string;
  generatorId: string;
  eventType: GeneratorEventType;
  timestamp: string; // ISO string
  readingId?: string;
  vibrationAtEvent?: number;
  metadata?: Record<string, unknown>;
}

export interface GeneratorStatus {
  isDeviceOnline: boolean;
  currentState: GeneratorState;
  startedAt?: string;
  stoppedAt?: string;
  currentRuntimeSeconds: number; // For active running sessions
  latestReading?: GeneratorReading;
  lastReceivedAt: string;
}

export interface RuntimeMetrics {
  todayRuntimeSeconds: number;
  last7DaysRuntimeSeconds: number;
  last30DaysRuntimeSeconds: number;
  totalRuntimeSeconds: number;
  selectedRangeRuntimeSeconds: number;
  totalStarts: number;
  avgRuntimePerDaySeconds: number;
  longestRuntimeSeconds: number;
  lastUpdatedAt: string;
}

export interface ChartDataPoint {
  timestamp: string;
  label: string;
  runtimeMinutes: number;
  runtimeFormatted: string;
  startsCount: number;
  avgVibration: number;
  peakVibration: number;
}

export interface ActivityInterval {
  id: string;
  state: 'ON' | 'OFF' | 'FAULT';
  startTime: string;
  endTime: string;
  durationSeconds: number;
  durationFormatted: string;
  avgVibration: number;
  startsAtLabel: string;
  endsAtLabel: string;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  code: string;
}

export type DateFilterType = 'today' | '7days' | '30days' | 'custom';

export interface DateFilterRange {
  type: DateFilterType;
  startDate: string; // ISO date string YYYY-MM-DD or full timestamp
  endDate: string; // ISO date string YYYY-MM-DD or full timestamp
  label: string;
}

export interface AlertThresholds {
  maxContinuousRuntimeHours: number;
  vibrationAnomalyThreshold: number;
  minFuelPercentage: number;
  voltageMin: number;
  voltageMax: number;
  frequencyMin: number;
  frequencyMax: number;
}

export interface BMCInfo {
  id: string;
  name: string;
  centerName: string;
  operatorName: string;
  operatorRole: string;
  location: string;
  generatorModel: string;
  generatorRatingKVA: number;
}

/**
 * Exact numerical runtime session model for each individual ON -> OFF interval.
 */
export interface GeneratorRuntimeSession {
  id: string;
  bmcId: string;
  generatorId: string;
  dateKey: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "01 Sep 2026"
  startTime: string; // ISO string e.g. "2026-09-01T06:42:13.000Z"
  stopTime?: string; // ISO string e.g. "2026-09-01T07:18:47.000Z" (undefined if running)
  startTimeLabel: string; // e.g. "06:42:13 AM"
  stopTimeLabel: string; // e.g. "07:18:47 AM" or "Currently Running"
  durationSeconds: number; // Exact integer seconds
  durationFormatted: string; // "HH:MM:SS" e.g. "00:36:34"
  status: 'RUNNING' | 'COMPLETED' | 'INTERRUPTED' | 'FAULT';
  startReadingId?: string;
  stopReadingId?: string;
  isOngoing?: boolean;
}

/**
 * Daily aggregation model containing all sessions and the daily total in HH:MM:SS.
 */
export interface DailyRuntimeSummary {
  dateKey: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "01 Sep 2026"
  dayOfWeek: string; // e.g. "Tue"
  dayNumber: number; // 1 to 31
  sessionsCount: number;
  totalSeconds: number; // Total seconds for this day
  totalFormatted: string; // "HH:MM:SS" e.g. "01:18:55"
  hasOperation: boolean;
  sessions: GeneratorRuntimeSession[];
}

/**
 * Monthly aggregation metrics for the Generator Runtime Records header cards.
 */
export interface MonthlyRuntimeMetrics {
  monthKey: string; // YYYY-MM e.g. "2026-09"
  monthLabel: string; // e.g. "September 2026"
  monthIndex: number; // 0 to 11
  year: number;
  totalSeconds: number;
  totalFormatted: string; // "HH:MM:SS" e.g. "02:55:29"
  operatingDaysCount: number; // e.g. 4 Days
  totalStartsCount: number; // e.g. 6
  avgRuntimePerSessionSeconds: number;
  avgRuntimeFormatted: string; // "HH:MM:SS" e.g. "00:43:52"
  longestRuntimeSeconds: number;
  longestRuntimeFormatted: string; // "HH:MM:SS" e.g. "00:53:47"
  dailySummaries: DailyRuntimeSummary[];
  allSessions: GeneratorRuntimeSession[];
}
