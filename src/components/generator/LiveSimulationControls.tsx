import React, { useState } from 'react';
import {
  Play,
  Square,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
  ChevronUp,
  ChevronDown,
  Sparkles,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { GeneratorStatus } from '../../types/generator';

interface LiveSimulationControlsProps {
  status: GeneratorStatus;
  onSetState: (state: 'ON' | 'OFF' | 'FAULT') => void;
  onToggleConnection: (isOnline: boolean) => void;
  onInjectSpike: () => void;
  isSimulating: boolean;
  onToggleSimulation: (enabled: boolean) => void;
}

export const LiveSimulationControls: React.FC<LiveSimulationControlsProps> = ({
  status,
  onSetState,
  onToggleConnection,
  onInjectSpike,
  isSimulating,
  onToggleSimulation,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [spikeInjected, setSpikeInjected] = useState(false);

  const handleSpike = () => {
    setSpikeInjected(true);
    onInjectSpike();
    setTimeout(() => setSpikeInjected(false), 2000);
  };

  const isRunning = status.currentState === 'ON';
  const isOnline = status.isDeviceOnline;

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      <div className="bg-white/95 border border-slate-300 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300 w-80 sm:w-96">
        {/* Toggle Bar */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Live Simulator & Telemetry Controls
            </span>
          </div>
          <button className="text-slate-500 hover:text-slate-800">
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Panel Content */}
        {!collapsed && (
          <div className="p-4 space-y-3.5 text-xs animate-fade-in font-mono">
            <p className="text-[11px] text-slate-600 font-sans leading-tight">
              Test state transitions, telemetry streaming, fault handling, and device disconnection in real time.
            </p>

            {/* Generator State Switch */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                Generator Power State:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSetState('ON')}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                    isRunning
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/50'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  START (ON)
                </button>

                <button
                  onClick={() => onSetState('OFF')}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                    status.currentState === 'OFF'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/50'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <Square className="w-3 h-3 fill-current" />
                  STOP (OFF)
                </button>

                <button
                  onClick={() => onSetState('FAULT')}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                    status.currentState === 'FAULT'
                      ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/50'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  FAULT
                </button>
              </div>
            </div>

            {/* Device Online / Offline toggle */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-600 font-medium">Device Link:</div>
              <button
                onClick={() => onToggleConnection(!isOnline)}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isOnline
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                    : 'bg-rose-50 border border-rose-300 text-rose-700'
                }`}
              >
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-rose-600" />}
                {isOnline ? 'Online (Connected)' : 'Offline (No Signal)'}
              </button>
            </div>

            {/* Inject Vibration spike & Pause Simulator */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                onClick={handleSpike}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center gap-1 transition-colors font-medium"
              >
                <Activity className="w-3 h-3 text-amber-600" />
                <span>{spikeInjected ? 'Spike Injected!' : 'Inject Vib Spike'}</span>
              </button>

              <button
                onClick={() => onToggleSimulation(!isSimulating)}
                className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center gap-1 transition-colors font-medium"
              >
                {isSimulating ? (
                  <>
                    <PauseCircle className="w-3 h-3 text-indigo-600" />
                    <span>Pause Ticker</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3 h-3 text-emerald-600" />
                    <span>Resume Ticker</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
