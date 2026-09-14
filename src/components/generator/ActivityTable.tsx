import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  WifiOff,
  Radio,
  PowerOff,
} from 'lucide-react';
import { GeneratorReading } from '../../types/generator';

interface ActivityTableProps {
  readings: GeneratorReading[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onExportCSV: () => void;
  isExporting?: boolean;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  readings,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  statusFilter,
  onStatusFilterChange,
  onExportCSV,
  isExporting = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Format date & time
  const formatDateTime = (isoString: string) => {
    const dt = new Date(isoString);
    const dateStr = dt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  // Status badge styling: GREEN when ON (Running), RED when OFF (Stopped)
  const renderStatusBadge = (state: string) => {
    switch (state) {
      case 'ON':
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            Running (ON)
          </span>
        );
      case 'FAULT':
      case 'Fault':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Fault
          </span>
        );
      case 'OFFLINE':
      case 'Offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        );
      case 'OFF':
      case 'Stopped':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
            <PowerOff className="w-3 h-3 text-rose-600" />
            Stopped (OFF)
          </span>
        );
    }
  };

  // Filter by local search term
  const displayedReadings = searchTerm
    ? readings.filter(
        (r) =>
          r.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.vibrationReading.toString().includes(searchTerm) ||
          r.generatorState.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : readings;

  return (
    <div className="industrial-card p-5 bg-white border-slate-200 shadow-sm">
      {/* Table Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-wide">
              Activity Timeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">
            <span className="text-emerald-700 font-bold">{totalCount}</span> readings found
          </p>
        </div>

        {/* Right Action Toolbar: Search, Status Filter, Export CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900">All Statuses</option>
              <option value="ON" className="bg-white text-emerald-700 font-bold">Running Only (ON)</option>
              <option value="OFF" className="bg-white text-rose-700 font-bold">Stopped Only (OFF)</option>
              <option value="FAULT" className="bg-white text-rose-600">Fault Only</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search telemetry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 w-36 sm:w-44 font-mono shadow-2xs"
            />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            disabled={isExporting || totalCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-mono uppercase text-[11px] bg-slate-50">
              <th className="py-3 px-4 font-bold">Date & Time</th>
              <th className="py-3 px-4 font-bold">Vibration Reading</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold hidden md:table-cell">Voltage</th>
              <th className="py-3 px-4 font-bold hidden lg:table-cell">Power / Current</th>
              <th className="py-3 px-4 font-bold hidden sm:table-cell">Fuel Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {displayedReadings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No telemetry records match the selected criteria.
                </td>
              </tr>
            ) : (
              displayedReadings.map((r) => {
                const { dateStr, timeStr } = formatDateTime(r.timestamp);
                const isHighVib = r.vibrationReading > 1.0;
                const isRunningRow = r.generatorState === 'ON' || r.generatorState === 'STARTING';

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors group ${
                      isRunningRow ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Date & Time */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{dateStr}</span>
                        <span className="text-slate-500 text-[11px] font-medium">{timeStr}</span>
                      </div>
                    </td>

                    {/* Vibration Reading - Highlighted in Amber/Orange */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black tabular-nums text-sm ${
                            isHighVib ? 'text-rose-700' : 'text-amber-800'
                          }`}
                        >
                          {r.vibrationReading.toFixed(4)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">m/s²</span>
                      </div>
                    </td>

                    {/* Status Badge: GREEN when ON, RED when OFF */}
                    <td className="py-3 px-4">
                      {renderStatusBadge(r.generatorState)}
                    </td>

                    {/* Voltage - Highlighted in Blue */}
                    <td className="py-3 px-4 hidden md:table-cell text-blue-800 font-bold tabular-nums">
                      {r.voltage && r.voltage > 0 ? `${r.voltage.toFixed(1)} V` : '0.0 V'}
                    </td>

                    {/* Power / Current - Highlighted in Purple */}
                    <td className="py-3 px-4 hidden lg:table-cell text-purple-800 font-bold tabular-nums">
                      {r.power && r.power > 0 ? (
                        <span>
                          {r.power.toFixed(2)} kW <span className="text-purple-600 font-normal">({r.current?.toFixed(1)} A)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">--</span>
                      )}
                    </td>

                    {/* Fuel Level */}
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {r.fuelLevel !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-300">
                            <div
                              className={`h-full rounded-full ${
                                r.fuelLevel > 50
                                  ? 'bg-emerald-500'
                                  : r.fuelLevel > 25
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${r.fuelLevel}%` }}
                            />
                          </div>
                          <span className="text-slate-700 font-bold text-[11px]">{r.fuelLevel}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium focus:outline-none shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>of {totalCount} records</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
