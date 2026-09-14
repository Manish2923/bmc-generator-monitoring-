import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { GeneratorMonitoringView } from './components/generator/GeneratorMonitoringView';
import { AlertsDrawer } from './components/generator/AlertsDrawer';
import { SettingsModal } from './components/generator/SettingsModal';
import { BMCInfo, GeneratorStatus, AlertItem, AlertThresholds } from './types/generator';
import { generatorService } from './services/mockGeneratorService';

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeRoute = 'generator-monitoring';

  // Shared Header Data
  const [bmcInfo, setBmcInfo] = useState<BMCInfo>({
    id: 'BMC-5780',
    name: 'BMC-5780 (Chirwa)',
    centerName: 'Chirwa BMC Center',
    operatorName: 'Incharge',
    operatorRole: 'BMC Incharge',
    location: 'Chirwa, Rajasthan (Zone-4)',
    generatorModel: 'Kirloskar KG1-25WS 25kVA Diesel Generator',
    generatorRatingKVA: 25,
  });

  const [status, setStatus] = useState<GeneratorStatus>({
    isDeviceOnline: true,
    currentState: 'OFF',
    currentRuntimeSeconds: 0,
    lastReceivedAt: new Date().toISOString(),
  });

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

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    generatorService.getBMCInfo('BMC-5780').then(setBmcInfo);
    generatorService.getStatus('BMC-5780').then(setStatus);
    generatorService.getAlerts('BMC-5780').then(setAlerts);
    generatorService.getAlertThresholds().then(setThresholds);

    const unsubscribe = generatorService.subscribe('BMC-5780', (update) => {
      setStatus(update.status);
      if (update.alerts) {
        setAlerts(update.alerts);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAlertRead = async (id: string) => {
    await generatorService.markAlertRead(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleDismissAlert = async (id: string) => {
    await generatorService.dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveThresholds = async (newThresholds: AlertThresholds) => {
    const saved = await generatorService.updateAlertThresholds(newThresholds);
    setThresholds(saved);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* 1. Industrial Left Sidebar - Exclusive to Generator Monitoring */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeRoute={activeRoute}
        onRouteChange={() => {}}
        bmcId={bmcInfo.id}
      />

      {/* 2. Main Viewport */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Header */}
        <TopHeader
          bmcInfo={bmcInfo}
          status={status}
          alerts={alerts}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content Area - Dedicated Generator Monitoring */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <GeneratorMonitoringView
            bmcInfo={bmcInfo}
            onOpenSettingsDirect={() => setIsSettingsOpen(true)}
          />
        </main>
      </div>

      {/* Global Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onMarkRead={handleMarkAlertRead}
        onDismiss={handleDismissAlert}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
        bmcInfo={bmcInfo}
      />
    </div>
  );
}

export default App;
