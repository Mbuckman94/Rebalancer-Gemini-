import { useState, useEffect } from 'react';

export interface AppConfig {
  tiingoKey: string;
  logodevKey: string;
  geminiKey: string;
}

const DEFAULT_CONFIG: AppConfig = {
  tiingoKey: '',
  logodevKey: '',
  geminiKey: '', // Will fallback to env var if empty
};

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('rebalancer_config');
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse config', e);
      }
    }
  }, []);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('rebalancer_config', JSON.stringify(updated));
      return updated;
    });
  };

  const getGeminiKey = () => {
    return config.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  return {
    config,
    updateConfig,
    isOpen,
    setIsOpen,
    getGeminiKey
  };
}
