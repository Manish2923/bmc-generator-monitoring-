import { GeneratorReading, GeneratorRuntimeSession } from '../types/generator';

/**
 * Exports exact generator runtime sessions to CSV file.
 * Columns: Date, Generator ID, Start Time, Stop Time, Runtime, Status
 */
export function exportRuntimeSessionsToCSV(
  sessions: GeneratorRuntimeSession[],
  monthLabel: string = 'September 2026',
  bmcId: string = 'BMC-5780'
): void {
  if (!sessions || sessions.length === 0) {
    alert(`No generator runtime sessions available for ${monthLabel}.`);
    return;
  }

  const headers = [
    'Date',
    'BMC ID',
    'Generator ID',
    'Start Time',
    'Stop Time',
    'Runtime (HH:MM:SS)',
    'Duration (Seconds)',
    'Status',
  ];

  const rows = sessions.map((s) => [
    s.dateLabel,
    s.bmcId || bmcId,
    s.generatorId || 'GEN-01',
    s.startTimeLabel,
    s.stopTimeLabel,
    s.durationFormatted,
    s.durationSeconds,
    s.status === 'RUNNING' ? 'Running' : 'Completed',
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const sanitizedMonth = monthLabel.toLowerCase().replace(/\s+/g, '-');
  link.setAttribute('href', url);
  link.setAttribute('download', `generator-runtime-records-${bmcId}-${sanitizedMonth}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports telemetry data to CSV file matching industrial sensor stream schema.
 */
export function exportTelemetryToCSV(readings: GeneratorReading[], bmcId: string = 'BMC-5780'): void {
  if (!readings || readings.length === 0) {
    alert('No generator activity data available for the selected period.');
    return;
  }

  const headers = [
    'Date',
    'Time',
    'BMC ID',
    'Generator ID',
    'Generator Status',
    'Vibration Reading (m/s²)',
    'Voltage (V)',
    'Current (A)',
    'Power (kW)',
    'Frequency (Hz)',
    'Fuel Level (%)',
    'Source',
  ];

  const rows = readings.map((r) => {
    const dt = new Date(r.timestamp);
    const dateStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    return [
      dateStr,
      timeStr,
      r.bmcId || bmcId,
      r.generatorId || 'GEN-01',
      r.generatorState === 'ON' ? 'Running' : r.generatorState === 'OFF' ? 'Stopped' : r.generatorState,
      r.vibrationReading !== undefined ? r.vibrationReading.toFixed(4) : '',
      r.voltage !== undefined && r.voltage > 0 ? r.voltage.toFixed(1) : '',
      r.current !== undefined && r.current > 0 ? r.current.toFixed(1) : '',
      r.power !== undefined && r.power > 0 ? r.power.toFixed(2) : '',
      r.frequency !== undefined && r.frequency > 0 ? r.frequency.toFixed(1) : '',
      r.fuelLevel !== undefined ? `${r.fuelLevel}%` : '',
      r.source || '',
    ];
  });

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `generator-monitoring-${bmcId}-${todayStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
