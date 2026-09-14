import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Check,
} from 'lucide-react';
import { AlertItem } from '../../types/generator';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpenSettings: () => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkRead,
  onDismiss,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">System Telemetry Alerts</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {alerts.filter((a) => !a.read).length} unread notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Alerts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {alerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p>No active alerts. All generator systems operating within normal parameters.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isWarning = alert.severity === 'warning';
              const isError = alert.severity === 'error';
              const dt = new Date(alert.timestamp);
              const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !alert.read
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isWarning
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : isError
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}
                      >
                        {isWarning || isError ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-semibold text-xs text-slate-900">
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-8">
                    {alert.message}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between pl-8 text-[11px]">
                    <span className="font-mono text-slate-400 text-[10px] uppercase">
                      Code: {alert.code}
                    </span>
                    <div className="flex items-center gap-2">
                      {!alert.read && (
                        <button
                          onClick={() => onMarkRead(alert.id)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Dismiss"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Threshold alerts configurable</span>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
          >
            Configure Thresholds
          </button>
        </div>
      </div>
    </div>
  );
};
