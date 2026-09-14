import {
  GeneratorReading,
  GeneratorEvent,
  GeneratorStatus,
  RuntimeMetrics,
  ChartDataPoint,
  ActivityInterval,
  AlertItem,
  DateFilterRange,
  AlertThresholds,
  BMCInfo,
  GeneratorState,
  MonthlyRuntimeMetrics,
} from '../types/generator';
import { IGeneratorService, TelemetryUpdateEvent } from './generatorService';
import {
  buildRuntimeSessions,
  computeRuntimeMetrics,
  generateChartData,
  buildActivityTimelineIntervals,
  calculateMonthlyRuntimeLedger,
} from './runtimeCalculator';

export class MockGeneratorService implements IGeneratorService {
  private bmcInfo: BMCInfo = {
    id: 'BMC-5780',
    name: 'BMC-5780 (Chirwa)',
    centerName: 'Chirwa BMC Center',
    operatorName: 'Incharge',
    operatorRole: 'BMC Incharge',
    location: 'Chirwa, Rajasthan (Zone-4)',
    generatorModel: 'Kirloskar KG1-25WS 25kVA Diesel Generator',
    generatorRatingKVA: 25,
  };

  private isDeviceOnline: boolean = true;
  private currentState: GeneratorState = 'OFF';
  private startedAt: string | undefined = undefined;
  private stoppedAt: string | undefined = undefined;

  private readings: GeneratorReading[] = [];
  private events: GeneratorEvent[] = [];
  private alerts: AlertItem[] = [];

  private alertThresholds: AlertThresholds = {
    maxContinuousRuntimeHours: 4.0,
    vibrationAnomalyThreshold: 3.8, // Abnormal vibration in m/s^2
    minFuelPercentage: 20,
    voltageMin: 200,
    voltageMax: 250,
    frequencyMin: 48.5,
    frequencyMax: 52.0,
  };

  private listeners: Set<(update: TelemetryUpdateEvent) => void> = new Set();
  private timerId: any = null;
  private isSimulating: boolean = true;
  private currentVibrationOffset: number = 0;

  constructor() {
    this.seedHistoricalData();
    this.startLiveSimulation();
  }

  /**
   * Seeds exact, realistic historical generator events and readings for September 2026
   * and previous months.
   */
  private seedHistoricalData(): void {
    const now = new Date();
    const readings: GeneratorReading[] = [];
    const events: GeneratorEvent[] = [];

    // Helper to create exact event pair
    const addSessionEvents = (startIso: string, stopIso: string, eventIdPrefix: string) => {
      const startDt = new Date(startIso);
      const stopDt = new Date(stopIso);

      events.push({
        id: `${eventIdPrefix}-start`,
        bmcId: this.bmcInfo.id,
        generatorId: 'GEN-01',
        eventType: 'START',
        timestamp: startDt.toISOString(),
        vibrationAtEvent: 2.14,
      });

      events.push({
        id: `${eventIdPrefix}-stop`,
        bmcId: this.bmcInfo.id,
        generatorId: 'GEN-01',
        eventType: 'STOP',
        timestamp: stopDt.toISOString(),
        vibrationAtEvent: 0.0276,
      });
    };

    // --- SEPTEMBER 2026 EXACT SESSIONS (Matching Specification Examples) ---
    // 01 Sep 2026 - Session 1: 06:42:13 AM to 07:18:47 AM (00:36:34)
    addSessionEvents(
      '2026-09-01T06:42:13.000+05:30',
      '2026-09-01T07:18:47.000+05:30',
      'ev-sep01-s1'
    );

    // 01 Sep 2026 - Session 2: 05:21:08 PM to 06:03:29 PM (00:42:21)
    addSessionEvents(
      '2026-09-01T17:21:08.000+05:30',
      '2026-09-01T18:03:29.000+05:30',
      'ev-sep01-s2'
    );

    // 04 Sep 2026 - Session 1: 08:12:04 AM to 09:05:51 AM (00:53:47 - Longest Run)
    addSessionEvents(
      '2026-09-04T08:12:04.000+05:30',
      '2026-09-04T09:05:51.000+05:30',
      'ev-sep04-s1'
    );

    // 09 Sep 2026 - Session 1: 07:31:22 PM to 08:14:09 PM (00:42:47)
    addSessionEvents(
      '2026-09-09T19:31:22.000+05:30',
      '2026-09-09T20:14:09.000+05:30',
      'ev-sep09-s1'
    );

    // 14 Sep 2026 (Today) - Morning Session: 07:10:14 AM to 07:22:31 AM (00:12:17)
    addSessionEvents(
      '2026-09-14T07:10:14.000+05:30',
      '2026-09-14T07:22:31.000+05:30',
      'ev-sep14-s1'
    );

    // 14 Sep 2026 (Today) - Evening Session: 06:21:00 PM to 06:33:16 PM (00:12:16)
    addSessionEvents(
      '2026-09-14T18:21:00.000+05:30',
      '2026-09-14T18:33:16.000+05:30',
      'ev-sep14-s2'
    );

    this.currentState = 'OFF';
    this.startedAt = new Date('2026-09-14T18:21:00.000+05:30').toISOString();
    this.stoppedAt = new Date('2026-09-14T18:33:16.000+05:30').toISOString();

    // --- AUGUST 2026 SESSIONS (For Monthly Filter Verification) ---
    addSessionEvents('2026-08-05T06:30:00.000+05:30', '2026-08-05T07:15:20.000+05:30', 'ev-aug05');
    addSessionEvents('2026-08-12T18:00:15.000+05:30', '2026-08-12T18:45:00.000+05:30', 'ev-aug12');
    addSessionEvents('2026-08-20T07:05:00.000+05:30', '2026-08-20T07:58:30.000+05:30', 'ev-aug20');
    addSessionEvents('2026-08-28T17:40:00.000+05:30', '2026-08-28T18:30:10.000+05:30', 'ev-aug28');

    // Generate intermittent readings for today and recent days
    for (let s = 0; s < 60; s++) {
      const sampleTime = new Date(now.getTime() - s * 60 * 1000);
      const isStopped = true;
      const vib = isStopped ? (0.026 + Math.random() * 0.012) : (1.9 + Math.random() * 0.4);

      readings.push({
        id: `rd-${sampleTime.getTime()}-${s}`,
        bmcId: this.bmcInfo.id,
        generatorId: 'GEN-01',
        timestamp: sampleTime.toISOString(),
        generatorState: 'OFF',
        vibrationReading: Number(vib.toFixed(4)),
        voltage: 0,
        current: 0,
        power: 0,
        frequency: 0,
        fuelLevel: 78,
        source: 'ESP32-Telemetry-Modbus',
        createdAt: sampleTime.toISOString(),
      });
    }

    // Sort readings descending
    this.readings = readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (this.readings.length > 0) {
      this.readings[0].vibrationReading = 0.0276;
    }

    // Sort events ascending
    this.events = events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Initial alert items
    this.alerts = [
      {
        id: 'alert-1',
        title: 'Routine Maintenance Due',
        message: 'Generator GEN-01 has accumulated over 120 hours. Oil filter replacement recommended.',
        severity: 'info',
        timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        read: false,
        code: 'MAINT_ROUTINE',
      },
      {
        id: 'alert-2',
        title: 'Grid Supply Restored',
        message: 'Normal 3-Phase Grid power restored. Generator switched to standby state.',
        severity: 'info',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        read: true,
        code: 'GRID_RESTORED',
      },
    ];
  }

  /**
   * Background telemetry ticker generating periodic live readings every 3 seconds.
   */
  private startLiveSimulation(): void {
    if (typeof window === 'undefined') return;

    this.timerId = setInterval(() => {
      if (!this.isSimulating || !this.isDeviceOnline) return;

      const now = new Date();
      const isRunning = this.currentState === 'ON';

      let vib = isRunning
        ? 1.9 + Math.random() * 0.4 + this.currentVibrationOffset
        : 0.026 + Math.random() * 0.015 + this.currentVibrationOffset;

      if (vib < 0.01) vib = 0.012;

      const reading: GeneratorReading = {
        id: `rd-live-${now.getTime()}`,
        bmcId: this.bmcInfo.id,
        generatorId: 'GEN-01',
        timestamp: now.toISOString(),
        generatorState: this.currentState,
        vibrationReading: Number(vib.toFixed(4)),
        voltage: isRunning ? Number((229.2 + (Math.random() * 4 - 2)).toFixed(1)) : 0,
        current: isRunning ? Number((17.8 + (Math.random() * 2 - 1)).toFixed(1)) : 0,
        power: isRunning ? Number((4.1 + (Math.random() * 0.4 - 0.2)).toFixed(2)) : 0,
        frequency: isRunning ? Number((50.0 + (Math.random() * 0.3 - 0.15)).toFixed(1)) : 0,
        fuelLevel: 68,
        source: 'ESP32-Telemetry-Modbus',
        createdAt: now.toISOString(),
      };

      this.readings.unshift(reading);
      if (this.readings.length > 500) {
        this.readings.pop();
      }

      if (vib > this.alertThresholds.vibrationAnomalyThreshold) {
        const anomalyAlert: AlertItem = {
          id: `alert-vib-${now.getTime()}`,
          title: 'Abnormal Vibration Spike Detected',
          message: `Vibration surged to ${vib.toFixed(4)} m/s² exceeding safety threshold (${this.alertThresholds.vibrationAnomalyThreshold} m/s²).`,
          severity: 'warning',
          timestamp: now.toISOString(),
          read: false,
          code: 'VIB_ANOMALY',
        };
        this.alerts.unshift(anomalyAlert);
      }

      const status = this.getDirectStatus(now);
      const defaultFilter: DateFilterRange = {
        type: 'today',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
        endDate: now.toISOString(),
        label: 'Today',
      };
      const metrics = this.getDirectRuntimeMetrics(defaultFilter, now);
      const monthlyLedger = calculateMonthlyRuntimeLedger(
        this.events,
        this.currentState,
        now.getFullYear(),
        now.getMonth(),
        now,
        this.bmcInfo.id,
        'GEN-01'
      );

      const updatePayload: TelemetryUpdateEvent = {
        status,
        newReading: reading,
        metrics,
        alerts: this.alerts,
        monthlyLedger,
      };

      this.listeners.forEach((listener) => {
        try {
          listener(updatePayload);
        } catch (e) {
          console.error('Error in telemetry listener:', e);
        }
      });
    }, 3000);
  }

  private getDirectStatus(now: Date = new Date()): GeneratorStatus {
    const latestReading = this.readings[0];
    let currentRuntimeSeconds = 0;

    if (this.currentState === 'ON' && this.startedAt) {
      currentRuntimeSeconds = Math.max(0, Math.floor((now.getTime() - new Date(this.startedAt).getTime()) / 1000));
    }

    return {
      isDeviceOnline: this.isDeviceOnline,
      currentState: this.currentState,
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      currentRuntimeSeconds,
      latestReading,
      lastReceivedAt: latestReading ? latestReading.timestamp : now.toISOString(),
    };
  }

  private getDirectRuntimeMetrics(filter: DateFilterRange, now: Date = new Date()): RuntimeMetrics {
    const filterStart = new Date(filter.startDate);
    const filterEnd = new Date(filter.endDate);

    const sessions = buildRuntimeSessions(this.events, this.currentState, now);
    return computeRuntimeMetrics(sessions, filterStart, filterEnd, now);
  }

  // --- IGeneratorService Implementations ---

  async getBMCInfo(_bmcId?: string): Promise<BMCInfo> {
    return { ...this.bmcInfo };
  }

  async getStatus(_bmcId?: string): Promise<GeneratorStatus> {
    return this.getDirectStatus(new Date());
  }

  async getReadings(
    _bmcId: string,
    filter: DateFilterRange,
    page: number = 1,
    pageSize: number = 10,
    statusFilter?: string
  ): Promise<{ readings: GeneratorReading[]; totalCount: number }> {
    const fStart = new Date(filter.startDate).getTime();
    const fEnd = new Date(filter.endDate).getTime();

    let filtered = this.readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= fStart && t <= fEnd;
    });

    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.generatorState === statusFilter);
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return { readings: paginated, totalCount };
  }

  async getAllFilteredReadings(_bmcId: string, filter: DateFilterRange): Promise<GeneratorReading[]> {
    const fStart = new Date(filter.startDate).getTime();
    const fEnd = new Date(filter.endDate).getTime();

    return this.readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= fStart && t <= fEnd;
    });
  }

  async getEvents(_bmcId: string, filter: DateFilterRange): Promise<GeneratorEvent[]> {
    const fStart = new Date(filter.startDate).getTime();
    const fEnd = new Date(filter.endDate).getTime();

    return this.events.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= fStart && t <= fEnd;
    });
  }

  async getRuntimeMetrics(_bmcId: string, filter: DateFilterRange): Promise<RuntimeMetrics> {
    return this.getDirectRuntimeMetrics(filter, new Date());
  }

  async getChartData(_bmcId: string, filter: DateFilterRange): Promise<ChartDataPoint[]> {
    const fStart = new Date(filter.startDate);
    const fEnd = new Date(filter.endDate);

    const sessions = buildRuntimeSessions(this.events, this.currentState, new Date());
    return generateChartData(sessions, this.readings, filter.type, fStart, fEnd);
  }

  async getActivityIntervals(_bmcId: string, filter: DateFilterRange): Promise<ActivityInterval[]> {
    const fStart = new Date(filter.startDate);
    const fEnd = new Date(filter.endDate);

    const sessions = buildRuntimeSessions(this.events, this.currentState, new Date());
    return buildActivityTimelineIntervals(sessions, this.events, fStart, fEnd);
  }

  async getMonthlyRuntimeRecords(
    _bmcId: string,
    year: number,
    monthIndex: number
  ): Promise<MonthlyRuntimeMetrics> {
    return calculateMonthlyRuntimeLedger(
      this.events,
      this.currentState,
      year,
      monthIndex,
      new Date(),
      this.bmcInfo.id,
      'GEN-01'
    );
  }

  async getAlerts(_bmcId?: string): Promise<AlertItem[]> {
    return [...this.alerts];
  }

  async markAlertRead(alertId: string): Promise<void> {
    const item = this.alerts.find((a) => a.id === alertId);
    if (item) item.read = true;
  }

  async dismissAlert(alertId: string): Promise<void> {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
  }

  async getAlertThresholds(_bmcId?: string): Promise<AlertThresholds> {
    return { ...this.alertThresholds };
  }

  async updateAlertThresholds(thresholds: Partial<AlertThresholds>): Promise<AlertThresholds> {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    return { ...this.alertThresholds };
  }

  subscribe(_bmcId: string, listener: (update: TelemetryUpdateEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- Real-Time Simulation Controls ---

  async setGeneratorState(bmcId: string, state: 'ON' | 'OFF' | 'FAULT'): Promise<void> {
    if (this.currentState === state) return;

    const now = new Date();
    const prev = this.currentState;
    this.currentState = state;

    let eventType: 'START' | 'STOP' | 'FAULT' | null = null;
    if (prev === 'OFF' && state === 'ON') {
      eventType = 'START';
      this.startedAt = now.toISOString();
    } else if (prev === 'ON' && state === 'OFF') {
      eventType = 'STOP';
      this.stoppedAt = now.toISOString();
    } else if (state === 'FAULT') {
      eventType = 'FAULT';
      this.stoppedAt = now.toISOString();
    }

    let newEvent: GeneratorEvent | undefined = undefined;
    if (eventType) {
      newEvent = {
        id: `ev-${now.getTime()}`,
        bmcId,
        generatorId: 'GEN-01',
        eventType,
        timestamp: now.toISOString(),
        vibrationAtEvent: state === 'ON' ? 2.18 : 0.0276,
      };
      this.events.push(newEvent);
    }

    const newReading: GeneratorReading = {
      id: `rd-${now.getTime()}`,
      bmcId,
      generatorId: 'GEN-01',
      timestamp: now.toISOString(),
      generatorState: state,
      vibrationReading: state === 'ON' ? 2.14 : 0.0276,
      voltage: state === 'ON' ? 231.2 : 0,
      current: state === 'ON' ? 18.2 : 0,
      power: state === 'ON' ? 4.21 : 0,
      frequency: state === 'ON' ? 50.0 : 0,
      fuelLevel: 68,
      source: 'Operator-Manual-Trigger',
      createdAt: now.toISOString(),
    };
    this.readings.unshift(newReading);

    const defaultFilter: DateFilterRange = {
      type: 'today',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
      endDate: now.toISOString(),
      label: 'Today',
    };
    const status = this.getDirectStatus(now);
    const metrics = this.getDirectRuntimeMetrics(defaultFilter, now);
    const monthlyLedger = calculateMonthlyRuntimeLedger(
      this.events,
      this.currentState,
      now.getFullYear(),
      now.getMonth(),
      now,
      this.bmcInfo.id,
      'GEN-01'
    );

    this.listeners.forEach((l) =>
      l({
        status,
        newReading,
        newEvent,
        metrics,
        alerts: this.alerts,
        monthlyLedger,
      })
    );
  }

  setDeviceConnection(isOnline: boolean): void {
    this.isDeviceOnline = isOnline;
    const now = new Date();
    const status = this.getDirectStatus(now);
    const defaultFilter: DateFilterRange = {
      type: 'today',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
      endDate: now.toISOString(),
      label: 'Today',
    };
    const metrics = this.getDirectRuntimeMetrics(defaultFilter, now);

    this.listeners.forEach((l) =>
      l({
        status,
        metrics,
        alerts: this.alerts,
      })
    );
  }

  injectVibrationSurge(_bmcId: string, value: number): void {
    this.currentVibrationOffset = value;
    setTimeout(() => {
      this.currentVibrationOffset = 0;
    }, 10000);
  }

  setSimulationSpeed(_multiplier: number): void {
    // Speed hook
  }

  isSimulationActive(): boolean {
    return this.isSimulating;
  }

  toggleSimulation(enabled: boolean): void {
    this.isSimulating = enabled;
  }
}

export const generatorService = new MockGeneratorService();
