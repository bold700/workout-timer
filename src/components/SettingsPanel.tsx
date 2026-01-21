import { useState } from 'react';
import { TimerMode } from '../types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SettingsPanelProps {
  mode: TimerMode;
  isVisible: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  currentSettings?: any;
}

export default function SettingsPanel({ mode, isVisible, onClose, onSave, currentSettings }: SettingsPanelProps) {
  const [settings, setSettings] = useState(() => {
    if (currentSettings) return currentSettings;
    
    switch (mode) {
      case 'countdown':
        return { minutes: 3, seconds: 0 };
      case 'interval':
        return { workTime: 30, restTime: 10, rounds: 8 };
      default:
        return {};
    }
  });

  const handleInputChange = (field: string, value: string) => {
    if (value === '') {
      setSettings({ ...settings, [field]: '' as any });
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        setSettings({ ...settings, [field]: numValue });
      }
    }
  };

  const handleInputBlur = (field: string, defaultValue: number, min?: number, max?: number) => {
    const currentValue = settings[field as keyof typeof settings];
    let finalValue: number = defaultValue;
    
    if (typeof currentValue === 'number') {
      finalValue = currentValue;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
    }
    
    setSettings({ ...settings, [field]: finalValue });
  };

  if (!isVisible) return null;

  const handleSave = () => {
    const validatedSettings: any = { ...settings };
    
    if (mode === 'countdown') {
      const minutes = typeof settings.minutes === 'number' ? settings.minutes : 0;
      const seconds = typeof settings.seconds === 'number' ? settings.seconds : 0;
      validatedSettings.minutes = Math.max(0, Math.min(99, minutes));
      validatedSettings.seconds = Math.max(0, Math.min(59, seconds));
    } else if (mode === 'interval') {
      const workTime = typeof settings.workTime === 'number' ? settings.workTime : 1;
      const restTime = typeof settings.restTime === 'number' ? settings.restTime : 1;
      const rounds = typeof settings.rounds === 'number' ? settings.rounds : 1;
      validatedSettings.workTime = Math.max(1, Math.min(600, workTime));
      validatedSettings.restTime = Math.max(1, Math.min(600, restTime));
      validatedSettings.rounds = Math.max(1, Math.min(50, rounds));
    }
    
    onSave(validatedSettings);
    onClose();
  };

  const inputClasses = cn(
    "w-full px-4 py-3 text-base rounded-lg",
    "bg-[var(--bg-tertiary)] text-white border-2 border-[var(--bg-tertiary)]",
    "focus:border-[var(--accent)] focus:outline-none transition-colors"
  );

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      <div 
        className={cn(
          "bg-[var(--bg-secondary)] rounded-2xl w-full max-w-[400px] max-h-[90vh] flex flex-col",
          "border border-[var(--bg-tertiary)] shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_20px_var(--accent-glow)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[var(--bg-tertiary)]">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button 
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg",
              "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent)]",
              "transition-all hover:shadow-[0_0_10px_var(--accent-glow)]"
            )}
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex flex-col gap-4">
            {mode === 'countdown' && (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Minutes
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="99"
                    className={inputClasses}
                    value={settings.minutes}
                    onChange={(e) => handleInputChange('minutes', e.target.value)}
                    onBlur={() => handleInputBlur('minutes', 0, 0, 99)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Seconds
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="59"
                    className={inputClasses}
                    value={settings.seconds}
                    onChange={(e) => handleInputChange('seconds', e.target.value)}
                    onBlur={() => handleInputBlur('seconds', 0, 0, 59)}
                  />
                </label>
              </>
            )}

            {mode === 'interval' && (
              <>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Work Time (seconds)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="600"
                    className={inputClasses}
                    value={settings.workTime}
                    onChange={(e) => handleInputChange('workTime', e.target.value)}
                    onBlur={() => handleInputBlur('workTime', 1, 1, 600)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Rest Time (seconds)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="600"
                    className={inputClasses}
                    value={settings.restTime}
                    onChange={(e) => handleInputChange('restTime', e.target.value)}
                    onBlur={() => handleInputBlur('restTime', 1, 1, 600)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Rounds
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    className={inputClasses}
                    value={settings.rounds}
                    onChange={(e) => handleInputChange('rounds', e.target.value)}
                    onBlur={() => handleInputBlur('rounds', 1, 1, 50)}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--bg-tertiary)]">
          <button 
            className={cn(
              "w-full py-4 text-lg font-bold rounded-lg uppercase tracking-wide",
              "bg-gradient-to-br from-[#00d9ff] to-[#00a8cc] text-white",
              "shadow-[0_4px_15px_var(--accent-glow)]",
              "hover:shadow-[0_6px_25px_var(--accent-glow),0_0_40px_var(--accent-glow)] hover:-translate-y-0.5",
              "active:translate-y-0 active:scale-[0.98] transition-all"
            )}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
