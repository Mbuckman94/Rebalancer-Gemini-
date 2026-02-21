import { useState } from 'react';
import { Sidebar, ViewType } from '@/components/layout/Sidebar';
import { PortfoliosView } from '@/views/PortfoliosView';
import { StrategiesView } from '@/views/StrategiesView';
import { ClientDetailView } from '@/views/ClientDetailView';
import { ApiKeyModal } from '@/components/settings/ApiKeyModal';
import { useConfig } from '@/hooks/use-config';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('portfolios');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { config } = useConfig(); 

  const handleNavigateToClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView('portfolios'); // Ensure sidebar stays on portfolios
  };

  const handleBackToPortfolios = () => {
    setSelectedClientId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex font-sans selection:bg-blue-500/30">
      {/* Fixed Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
            setCurrentView(view);
            setSelectedClientId(null); // Reset detail view on nav change
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 min-h-screen relative overflow-x-hidden">
        {/* Background Gradients for Atmosphere */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
        </div>

        {/* View Content */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {currentView === 'portfolios' && !selectedClientId && (
            <PortfoliosView onNavigateToClient={handleNavigateToClient} />
          )}
          {currentView === 'portfolios' && selectedClientId && (
            <ClientDetailView clientId={selectedClientId} onBack={handleBackToPortfolios} />
          )}
          {currentView === 'strategies' && <StrategiesView />}
        </div>
      </main>

      {/* Modals */}
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
