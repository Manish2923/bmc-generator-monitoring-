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
  MonthlyRuntimeMetrics,
} from '../types/generator';

export interface TelemetryUpdateEvent {
  status: GeneratorStatus;
  newReading?: GeneratorReading;
  newEvent?: GeneratorEvent;
  metrics: RuntimeMetrics;
  alerts?: AlertItem[];
  monthlyLedger?: MonthlyRuntimeMetrics;
}

export interface IGeneratorService {
  getBMCInfo(bmcId?: string): Promise<BMCInfo>;
  getStatus(bmcId?: string): Promise<GeneratorStatus>;
  getReadings(
    bmcId: string,
    filter: DateFilterRange,
    page?: number,
    pageSize?: number,
    statusFilter?: string
  ): Promise<{ readings: GeneratorReading[]; totalCount: number }>;
  getAllFilteredReadings(bmcId: string, filter: DateFilterRange): Promise<GeneratorReading[]>;
  getEvents(bmcId: string, filter: DateFilterRange): Promise<GeneratorEvent[]>;
  getRuntimeMetrics(bmcId: string, filter: DateFilterRange): Promise<RuntimeMetrics>;
  getChartData(bmcId: string, filter: DateFilterRange): Promise<ChartDataPoint[]>;
  getActivityIntervals(bmcId: string, filter: DateFilterRange): Promise<ActivityInterval[]>;
  getMonthlyRuntimeRecords(bmcId: string, year: number, monthIndex: number): Promise<MonthlyRuntimeMetrics>;
  getAlerts(bmcId?: string): Promise<AlertItem[]>;
  markAlertRead(alertId: string): Promise<void>;
  dismissAlert(alertId: string): Promise<void>;
  getAlertThresholds(bmcId?: string): Promise<AlertThresholds>;
  updateAlertThresholds(thresholds: Partial<AlertThresholds>): Promise<AlertThresholds>;

  // Real-time pub/sub
  subscribe(bmcId: string, listener: (update: TelemetryUpdateEvent) => void): () => void;

  // Simulation controls (for testing and field demonstration)
  setGeneratorState(bmcId: string, state: 'ON' | 'OFF' | 'FAULT'): Promise<void>;
  setDeviceConnection(isOnline: boolean): void;
  injectVibrationSurge(bmcId: string, value: number): void;
  setSimulationSpeed(speedMultiplier: number): void;
  isSimulationActive(): boolean;
  toggleSimulation(enabled: boolean): void;
}
