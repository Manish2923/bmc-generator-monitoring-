import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Clock,
  SlidersHorizontal,
  Zap,
  PowerOff,
  User,
} from 'lucide-react';
import { BMCInfo, GeneratorStatus, AlertItem } from '../../types/generator';

interface TopHeaderProps {
  bmcInfo: BMCInfo;
  status: GeneratorStatus;
  alerts: AlertItem[];
  onToggleSidebar: () => void;
  onOpenAlerts: () => void;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  bmcInfo,
  status,
  alerts,
  onToggleSidebar,
  onOpenAlerts,
  onOpenSettings,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;
  const isRunning = status.currentState === 'ON';

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-2.5 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs select-none">
      {/* Left: Mobile Menu, BMC Identifier & Generator State */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden p-1.5 sm:p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 transition-colors"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* BMC Center Name on large screens */}
        <div className="hidden lg:flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            BMC Center
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-wide truncate max-w-[140px]">
            {bmcInfo.centerName}
          </span>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 hidden lg:block" />

        {/* BMC ID Badge */}
        <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 sm:py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold shadow-2xs shrink-0">
          {bmcInfo.id}
        </span>

        {/* Dynamic Generator State Pill: GREEN when ON, RED when OFF */}
        <span
          className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 border transition-all shrink-0 ${
            isRunning
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
              : 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
          }`}
        >
          {isRunning ? (
            <>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
              <span>ON</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500"></span>
              <PowerOff className="w-3 h-3 text-rose-600" />
              <span>OFF</span>
            </>
          )}
        </span>
      </div>

      {/* Right: Unified Live Clock & Telemetry + Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Unified Live Telemetry & Real-Time Clock Pill */}
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
          {/* Pulsing Beacon */}
          <span className="relative flex h-2 w-2 shrink-0">
            {status.isDeviceOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>

          <span className="hidden md:inline text-[10px] font-bold font-mono text-emerald-700">LIVE</span>
          <span className="text-slate-300 hidden md:inline">•</span>

          {/* Real-Time Clock */}
          <div className="flex items-center gap-1 text-slate-800 font-mono text-[10px] sm:text-xs">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="font-bold text-slate-900 tracking-tight tabular-nums whitespace-nowrap">
              {currentTime}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-200 hidden xl:block" />
          <span className="text-slate-500 text-xs hidden xl:inline">{currentDate}</span>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Telemetry & Threshold Settings"
          className="p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
        </button>

        {/* Alerts / Notifications Icon with Count Badge */}
        <button
          onClick={onOpenAlerts}
          title="System Telemetry Alerts"
          className="relative p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1 py-0.2 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-xs animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* User / Operator Profile Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 border border-emerald-300 shadow-2xs flex items-center justify-center">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[90px]">{bmcInfo.operatorName}</span>
            <span className="text-[10px] text-slate-500 font-mono font-medium">{bmcInfo.operatorRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
