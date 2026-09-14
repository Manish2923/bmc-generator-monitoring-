import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Clock,
  Calendar,
  Radio,
  WifiOff,
  User,
  SlidersHorizontal,
  Zap,
  PowerOff,
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

  const formatLastReceived = (isoString?: string) => {
    if (!isoString) return '--:--:--';
    const dt = new Date(isoString);
    return dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm select-none">
      {/* Left: Mobile hamburger & BMC identifier metadata */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              BMC Center
            </span>
            <span className="text-xs font-bold text-slate-900 tracking-wide truncate max-w-[140px]">
              {bmcInfo.centerName}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden lg:block" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold shadow-xs shrink-0">
              {bmcInfo.id}
            </span>

            {/* Dynamic Status Pill in Header: GREEN when ON, RED when OFF */}
            <span
              className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 sm:gap-1.5 border transition-all shrink-0 ${
                isRunning
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                  : 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
              }`}
            >
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500 hidden xs:inline" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <PowerOff className="w-3 h-3 text-rose-600 hidden xs:inline" />
                  <span>OFF</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Live Connection, Clock/Date, Alerts, Settings, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
        {/* Real-time Connection status indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          {status.isDeviceOnline ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-emerald-700 font-mono tracking-tight flex items-center gap-1">
                  <Radio className="w-3 h-3 inline text-emerald-600" /> LIVE
                </span>
                <span className="text-[9px] text-slate-500 font-mono hidden md:inline">
                  Last: {formatLastReceived(status.lastReceivedAt)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-rose-700 font-mono tracking-tight flex items-center gap-1">
                  <WifiOff className="w-3 h-3 inline text-rose-600" /> OFFLINE
                </span>
                <span className="text-[9px] text-slate-500 font-mono hidden md:inline">
                  Disconnected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Clock and Date */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-800 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-bold text-slate-900 tracking-wide tabular-nums">{currentTime}</span>
          </div>
          <div className="h-3.5 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 font-medium">{currentDate}</span>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Telemetry & Threshold Settings"
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
        </button>

        {/* Alerts / Notifications icon with badge */}
        <button
          onClick={onOpenAlerts}
          title="System Telemetry Alerts"
          className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white font-mono font-black text-[10px] flex items-center justify-center shadow-sm animate-pulse">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* User / Operator Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 p-[1.5px] shadow-sm flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">{bmcInfo.operatorName}</span>
            <span className="text-[10px] text-slate-500 font-mono font-medium">{bmcInfo.operatorRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
