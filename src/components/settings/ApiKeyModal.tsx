import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useConfig } from '@/hooks/use-config';
import { Eye, EyeOff, Save } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { config, updateConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    updateConfig(localConfig);
    onClose();
  };

  const toggleShow = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInput = (label: string, key: keyof typeof config, placeholder: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <div className="relative">
        <Input
          type={showKeys[key] ? "text" : "password"}
          value={localConfig[key]}
          onChange={(e) => setLocalConfig({ ...localConfig, [key]: e.target.value })}
          placeholder={placeholder}
          className="pr-10 font-mono"
        />
        <button
          type="button"
          onClick={() => toggleShow(key as string)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
        >
          {showKeys[key] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Configuration">
      <div className="space-y-6">
        <p className="text-sm text-zinc-500">
          Configure your API keys for data providers. These are stored locally in your browser.
        </p>
        
        <div className="space-y-4">
          {renderInput("Finnhub API Key", "finnhubKey", "Enter Finnhub key...")}
          {renderInput("Tiingo API Key", "tiingoKey", "Enter Tiingo key...")}
          {renderInput("Logo.dev API Key", "logodevKey", "Enter Logo.dev key...")}
          
          <div className="pt-4 border-t border-zinc-800">
            {renderInput("Gemini API Key (Optional Override)", "geminiKey", "Leave empty to use system key")}
            <p className="text-xs text-zinc-600 mt-1">
              The system automatically injects a Gemini key. Only set this if you need to override it.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
}
