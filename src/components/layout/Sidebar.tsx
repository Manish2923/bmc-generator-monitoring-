import React from 'react';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Milk,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRoute: string;
  onRouteChange: (route: string) => void;
  bmcId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeRoute = 'generator-monitoring',
  onRouteChange,
  bmcId = 'BMC-5780',
}) => {
  const menuSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'generator-monitoring', label: 'Generator Monitoring', icon: Zap, isPrimary: true },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 select-none shadow-sm ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
            <Milk className="w-5 h-5 text-emerald-600" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                BMC Portal
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">{bmcId}</span>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links - ONLY Generator Monitoring */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-500 group-hover:text-slate-900 group-hover:scale-105'
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 text-left font-semibold">{item.label}</span>
                    )}

                    {!collapsed && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        {!collapsed ? (
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-900 truncate">IoT Gateway Active</div>
              <div className="text-[10px] text-slate-500 font-mono">Modbus RS485 • Online</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="IoT Gateway Active: Modbus RS485 Online">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
