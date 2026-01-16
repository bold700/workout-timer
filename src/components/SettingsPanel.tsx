import { useState } from 'react';
import { TimerMode } from '../types';
import './SettingsPanel.css';

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

  // Helper function to handle input changes - allows empty strings
  const handleInputChange = (field: string, value: string) => {
    // Allow empty string for better UX when clearing
    if (value === '') {
      setSettings({ ...settings, [field]: '' as any });
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        setSettings({ ...settings, [field]: numValue });
      }
    }
  };

  // Validate and set defaults on blur
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
    // Ensure all values are valid numbers before saving
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

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          {mode === 'countdown' && (
            <div className="setting-group">
              <label>
                <span>Minutes</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="99"
                  value={typeof settings.minutes === 'string' ? settings.minutes : settings.minutes}
                  onChange={(e) => handleInputChange('minutes', e.target.value)}
                  onBlur={() => handleInputBlur('minutes', 0, 0, 99)}
                />
              </label>
              <label>
                <span>Seconds</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={typeof settings.seconds === 'string' ? settings.seconds : settings.seconds}
                  onChange={(e) => handleInputChange('seconds', e.target.value)}
                  onBlur={() => handleInputBlur('seconds', 0, 0, 59)}
                />
              </label>
            </div>
          )}

          {mode === 'interval' && (
            <div className="setting-group">
              <label>
                <span>Work Time (seconds)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="600"
                  value={typeof settings.workTime === 'string' ? settings.workTime : settings.workTime}
                  onChange={(e) => handleInputChange('workTime', e.target.value)}
                  onBlur={() => handleInputBlur('workTime', 1, 1, 600)}
                />
              </label>
              <label>
                <span>Rest Time (seconds)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="600"
                  value={typeof settings.restTime === 'string' ? settings.restTime : settings.restTime}
                  onChange={(e) => handleInputChange('restTime', e.target.value)}
                  onBlur={() => handleInputBlur('restTime', 1, 1, 600)}
                />
              </label>
              <label>
                <span>Rounds</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="50"
                  value={typeof settings.rounds === 'string' ? settings.rounds : settings.rounds}
                  onChange={(e) => handleInputChange('rounds', e.target.value)}
                  onBlur={() => handleInputBlur('rounds', 1, 1, 50)}
                />
              </label>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
