import React from 'react';
import { Briefcase, Layers, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export type ViewType = 'portfolios' | 'strategies';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenSettings: () => void;
}

export function Sidebar({ currentView, onViewChange, onOpenSettings }: SidebarProps) {
  const NavItem = ({ view, icon: Icon, label }: { view: ViewType; icon: any; label: string }) => (
    <button
      onClick={() => onViewChange(view)}
      className={cn(
        "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group",
        currentView === view 
          ? "bg-zinc-800 text-blue-500 shadow-inner" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
      )}
      title={label}
    >
      <Icon className="h-5 w-5 mb-1" />
    </button>
  );

  return (
    <div className="fixed left-0 top-0 h-full w-20 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-6 z-40">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <span className="text-white font-bold text-lg tracking-tighter">IA</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-4 w-full items-center">
        <NavItem view="portfolios" icon={Briefcase} label="Portfolios" />
        <NavItem view="strategies" icon={Layers} label="Model Strategies" />
      </div>

      {/* Footer Actions */}
      <div className="mt-auto flex flex-col gap-4 w-full items-center">
        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        
        <div className="w-8 h-[1px] bg-zinc-900 my-2" />
        
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500 cursor-help" title="User">
          TM
        </div>
      </div>
    </div>
  );
}
