import React, { useState, useEffect, useCallback } from 'react';
import {
  GeneratorStatus,
  RuntimeMetrics,
  ChartDataPoint,
  ActivityInterval,
  GeneratorReading,
  AlertItem,
  DateFilterRange,
  AlertThresholds,
  BMCInfo,
  MonthlyRuntimeMetrics,
} from '../../types/generator';
import { generatorService } from '../../services/mockGeneratorService';
import { exportTelemetryToCSV, exportRuntimeSessionsToCSV } from '../../services/csvExporter';
import { PageHeader } from './PageHeader';
import { MetricCards } from './MetricCards';
import { SelectedRangeSummary } from './SelectedRangeSummary';
import { GeneratorRuntimeRecords } from './GeneratorRuntimeRecords';
import { RuntimeChart } from './RuntimeChart';
import { GeneratorActivityTimeline } from './GeneratorActivityTimeline';
import { ActivityTable } from './ActivityTable';
import { AlertsDrawer } from './AlertsDrawer';
import { SettingsModal } from './SettingsModal';
import { LiveSimulationControls } from './LiveSimulationControls';
import { WifiOff } from 'lucide-react';

interface GeneratorMonitoringViewProps {
  bmcInfo: BMCInfo;
  onOpenSettingsDirect?: () => void;
}

export const GeneratorMonitoringView: React.FC<GeneratorMonitoringViewProps> = ({
  bmcInfo,
}) => {
  // State: Filter range for live telemetry view
  const [filter, setFilter] = useState<DateFilterRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return {
      type: 'today',
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      label: 'Today',
    };
  });

  // State: Selected Month for the Generator Runtime Records section (default Sep 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // 8 = September

  // State: Status & Telemetry
  const [status, setStatus] = useState<GeneratorStatus>({
    isDeviceOnline: true,
    currentState: 'OFF',
    currentRuntimeSeconds: 0,
    lastReceivedAt: new Date().toISOString(),
  });

  const [metrics, setMetrics] = useState<RuntimeMetrics>({
    todayRuntimeSeconds: 1440,
    last7DaysRuntimeSeconds: 18540,
    last30DaysRuntimeSeconds: 80340,
    totalRuntimeSeconds: 83040,
    selectedRangeRuntimeSeconds: 1440,
    totalStarts: 2,
    avgRuntimePerDaySeconds: 1440,
    longestRuntimeSeconds: 720,
    lastUpdatedAt: '06:33:16 PM',
  });

  // State: Exact Monthly Runtime Ledger
  const [monthlyData, setMonthlyData] = useState<MonthlyRuntimeMetrics>({
    monthKey: '2026-09',
    monthLabel: 'September 2026',
    monthIndex: 8,
    year: 2026,
    totalSeconds: 10529, // 02:55:29
    totalFormatted: '02:55:29',
    operatingDaysCount: 4,
    totalStartsCount: 6,
    avgRuntimePerSessionSeconds: 2632, // 00:43:52
    avgRuntimeFormatted: '00:43:52',
    longestRuntimeSeconds: 3227, // 00:53:47
    longestRuntimeFormatted: '00:53:47',
    dailySummaries: [],
    allSessions: [],
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activityIntervals, setActivityIntervals] = useState<ActivityInterval[]>([]);
  const [readings, setReadings] = useState<GeneratorReading[]>([]);
  const [totalReadingsCount, setTotalReadingsCount] = useState<number>(0);

  // Pagination & Filtering in Activity Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Alerts & Thresholds
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    maxContinuousRuntimeHours: 4.0,
    vibrationAnomalyThreshold: 3.8,
    minFuelPercentage: 20,
    voltageMin: 200,
    voltageMax: 250,
    frequencyMin: 48.5,
    frequencyMax: 52.0,
  });

  // UI Modals
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);

  // Load telemetry & monthly data
  const loadDashboardData = useCallback(async (activeFilter: DateFilterRange, yr: number, mIdx: number) => {
    setIsLoading(true);
    try {
      const [
        currentStatus,
        calculatedMetrics,
        monthlyLedger,
        chartSeries,
        intervals,
        tableData,
        alertList,
        currentThresholds,
      ] = await Promise.all([
        generatorService.getStatus(bmcInfo.id),
        generatorService.getRuntimeMetrics(bmcInfo.id, activeFilter),
        generatorService.getMonthlyRuntimeRecords(bmcInfo.id, yr, mIdx),
        generatorService.getChartData(bmcInfo.id, activeFilter),
        generatorService.getActivityIntervals(bmcInfo.id, activeFilter),
        generatorService.getReadings(bmcInfo.id, activeFilter, currentPage, pageSize, statusFilter),
        generatorService.getAlerts(bmcInfo.id),
        generatorService.getAlertThresholds(),
      ]);

      setStatus(currentStatus);
      setMetrics(calculatedMetrics);
      setMonthlyData(monthlyLedger);
      setChartData(chartSeries);
      setActivityIntervals(intervals);
      setReadings(tableData.readings);
      setTotalReadingsCount(tableData.totalCount);
      setAlerts(alertList);
      setThresholds(currentThresholds);
    } catch (err) {
      console.error('Failed to load generator telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bmcInfo.id, currentPage, pageSize, statusFilter]);

  // Initial load and on filter/month change
  useEffect(() => {
    loadDashboardData(filter, selectedYear, selectedMonthIndex);
  }, [filter, selectedYear, selectedMonthIndex, loadDashboardData]);

  // Subscribe to real-time IoT updates
  useEffect(() => {
    const unsubscribe = generatorService.subscribe(bmcInfo.id, (update) => {
      setStatus(update.status);
      setMetrics(update.metrics);
      if (update.alerts) {
        setAlerts(update.alerts);
      }
      if (update.monthlyLedger && update.monthlyLedger.year === selectedYear && update.monthlyLedger.monthIndex === selectedMonthIndex) {
        setMonthlyData(update.monthlyLedger);
      }

      // If user is on page 1 of Today filter, seamlessly update table and chart
      if (currentPage === 1 && filter.type === 'today') {
        if (update.newReading) {
          setReadings((prev) => [update.newReading!, ...prev.slice(0, pageSize - 1)]);
          setTotalReadingsCount((prev) => prev + 1);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [bmcInfo.id, currentPage, filter.type, pageSize, selectedYear, selectedMonthIndex]);

  // Handlers
  const handleFilterChange = (newFilter: DateFilterRange) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleMonthChange = (year: number, monthIndex: number) => {
    setSelectedYear(year);
    setSelectedMonthIndex(monthIndex);
  };

  const handleExportTelemetryCSV = async () => {
    setIsExporting(true);
    try {
      const allReadings = await generatorService.getAllFilteredReadings(bmcInfo.id, filter);
      exportTelemetryToCSV(allReadings, bmcInfo.id);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMonthlyRuntimeCSV = () => {
    exportRuntimeSessionsToCSV(monthlyData.allSessions, monthlyData.monthLabel, bmcInfo.id);
  };

  const handleSetGeneratorState = async (newState: 'ON' | 'OFF' | 'FAULT') => {
    await generatorService.setGeneratorState(bmcInfo.id, newState);
    loadDashboardData(filter, selectedYear, selectedMonthIndex);
  };

  const handleToggleConnection = (online: boolean) => {
    generatorService.setDeviceConnection(online);
  };

  const handleInjectSpike = () => {
    generatorService.injectVibrationSurge(bmcInfo.id, 4.2);
  };

  const handleToggleSimulation = (enabled: boolean) => {
    generatorService.toggleSimulation(enabled);
    setIsSimulating(enabled);
  };

  const handleSaveThresholds = async (newThresholds: AlertThresholds) => {
    const saved = await generatorService.updateAlertThresholds(newThresholds);
    setThresholds(saved);
  };

  const handleMarkAlertRead = async (id: string) => {
    await generatorService.markAlertRead(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleDismissAlert = async (id: string) => {
    await generatorService.dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Offline Alert Banner if IoT device is disconnected */}
      {!status.isDeviceOnline && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 animate-pulse">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-white">Monitoring Device is Offline</span>
              <span className="text-xs text-rose-300">
                The gateway has lost communication with generator telemetry node. Showing last cached state.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleToggleConnection(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition-colors"
          >
            Reconnect Gateway
          </button>
        </div>
      )}

      {/* 1. Page Header with Title & Date Range Selector */}
      <PageHeader
        filter={filter}
        onFilterChange={handleFilterChange}
        generatorState={status.currentState}
      />

      {/* 2. Top Metric Cards (Current Status, Today's Runtime, Last 7 Days, Total Runtime) */}
      <MetricCards status={status} metrics={metrics} />

      {/* 3. Selected Range Summary Card */}
      <SelectedRangeSummary
        filter={filter}
        metrics={metrics}
        onRefresh={() => loadDashboardData(filter, selectedYear, selectedMonthIndex)}
        isLoading={isLoading}
      />

      {/* 4. PRIMARY SECTION: Exact Numerical Generator Runtime Records */}
      <GeneratorRuntimeRecords
        monthlyData={monthlyData}
        status={status}
        selectedYear={selectedYear}
        selectedMonthIndex={selectedMonthIndex}
        onMonthChange={handleMonthChange}
        onExportCSV={handleExportMonthlyRuntimeCSV}
        isLoading={isLoading}
      />

      {/* 5. SECONDARY SECTION: Generator Runtime Trend Graph (Collapsible Visual Summary) */}
      <RuntimeChart
        data={chartData}
        filterType={filter.type}
        isLoading={isLoading}
      />

      {/* 6. Generator Activity ON/OFF Timeline Strip */}
      <GeneratorActivityTimeline
        intervals={activityIntervals}
        isLoading={isLoading}
      />

      {/* 7. Activity Timeline Table with VIBRATION READING and Export CSV */}
      <ActivityTable
        readings={readings}
        totalCount={totalReadingsCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(st) => {
          setStatusFilter(st);
          setCurrentPage(1);
        }}
        onExportCSV={handleExportTelemetryCSV}
        isExporting={isExporting}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onMarkRead={handleMarkAlertRead}
        onDismiss={handleDismissAlert}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
        bmcInfo={bmcInfo}
      />

      {/* Live Simulation Controls */}
      <LiveSimulationControls
        status={status}
        onSetState={handleSetGeneratorState}
        onToggleConnection={handleToggleConnection}
        onInjectSpike={handleInjectSpike}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
      />
    </div>
  );
};
