import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Check,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { AlertThresholds, BMCInfo } from '../../types/generator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: AlertThresholds;
  onSaveThresholds: (thresholds: AlertThresholds) => Promise<void>;
  bmcInfo: BMCInfo;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
  bmcInfo,
}) => {
  const [formData, setFormData] = useState<AlertThresholds>(thresholds);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(thresholds);
  }, [thresholds, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveThresholds(formData);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setFormData({
      maxContinuousRuntimeHours: 4.0,
      vibrationAnomalyThreshold: 3.8,
      minFuelPercentage: 20,
      voltageMin: 200,
      voltageMax: 250,
      frequencyMin: 48.5,
      frequencyMax: 52.0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Generator Telemetry & Alert Settings</h2>
              <p className="text-xs text-slate-500 font-mono">
                {bmcInfo.generatorModel} • {bmcInfo.id}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs bg-slate-50/30">
          {/* Engineering notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-blue-900 leading-relaxed">
              <strong>Telemetry Threshold Rule:</strong> Real-time alerts trigger automatically when incoming sensor samples breach these configured parameters. State classification is decoupled from vibration thresholding.
            </div>
          </div>

          {/* Threshold Inputs */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] font-mono border-b border-slate-200 pb-1">
              Operational Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Max Continuous Runtime */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Max Continuous Run</span>
                  <span className="text-indigo-600 font-mono font-bold">{formData.maxContinuousRuntimeHours} hrs</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formData.maxContinuousRuntimeHours}
                  onChange={(e) =>
                    setFormData({ ...formData, maxContinuousRuntimeHours: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Alerts if run duration exceeds threshold</span>
              </div>

              {/* Vibration Anomaly Threshold */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Vibration Spike Limit</span>
                  <span className="text-amber-600 font-mono font-bold">{formData.vibrationAnomalyThreshold} m/s²</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="15"
                  value={formData.vibrationAnomalyThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, vibrationAnomalyThreshold: parseFloat(e.target.value) || 3.0 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Triggers abnormal vibration notification</span>
              </div>

              {/* Min Fuel Level */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Low Fuel Warning</span>
                  <span className="text-rose-600 font-mono font-bold">{formData.minFuelPercentage}%</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.minFuelPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, minFuelPercentage: parseInt(e.target.value) || 15 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Triggers low diesel level alert</span>
              </div>

              {/* Voltage Normal Range */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Target Voltage Range</span>
                  <span className="text-blue-600 font-mono font-bold">
                    {formData.voltageMin}V - {formData.voltageMax}V
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.voltageMin}
                    onChange={(e) => setFormData({ ...formData, voltageMin: parseInt(e.target.value) || 180 })}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
                    placeholder="Min"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    value={formData.voltageMax}
                    onChange={(e) => setFormData({ ...formData, voltageMax: parseInt(e.target.value) || 260 })}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-mono focus:border-indigo-500 focus:bg-white focus:outline-none"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generator Equipment Info */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <h4 className="font-bold text-slate-700 font-mono text-[11px] uppercase">
              Registered Hardware Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
              <div>Generator Rating: <span className="text-slate-900 font-semibold">{bmcInfo.generatorRatingKVA} kVA</span></div>
              <div>Telemetry Protocol: <span className="text-slate-900 font-semibold">Modbus RTU / TCP</span></div>
              <div>Sampling Interval: <span className="text-slate-900 font-semibold">3000 ms</span></div>
              <div>Site Location: <span className="text-slate-900 font-semibold">{bmcInfo.location}</span></div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Saved!
                </>
              ) : isSaving ? (
                'Saving...'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
