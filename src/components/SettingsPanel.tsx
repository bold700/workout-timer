import { useState, useEffect } from 'react';
import { TimerMode } from '../types';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsPanelProps {
  mode: TimerMode;
  onClose: () => void;
  onSave: (settings: any) => void;
  currentSettings?: any;
}

export default function SettingsPanel({ mode, onClose, onSave, currentSettings }: SettingsPanelProps) {
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

  // Update settings when currentSettings changes
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

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

  return (
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogDescription>
          {mode === 'countdown' 
            ? "Set the countdown duration."
            : mode === 'interval'
            ? "Configure your interval training settings."
            : "Configure your timer settings."
          }
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4">
        {mode === 'countdown' && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                inputMode="numeric"
                min="0"
                max="99"
                value={settings.minutes}
                onChange={(e) => handleInputChange('minutes', e.target.value)}
                onBlur={() => handleInputBlur('minutes', 0, 0, 99)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                inputMode="numeric"
                min="0"
                max="59"
                value={settings.seconds}
                onChange={(e) => handleInputChange('seconds', e.target.value)}
                onBlur={() => handleInputBlur('seconds', 0, 0, 59)}
              />
            </div>
          </>
        )}

        {mode === 'interval' && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="workTime">Work Time (seconds)</Label>
              <Input
                id="workTime"
                type="number"
                inputMode="numeric"
                min="1"
                max="600"
                value={settings.workTime}
                onChange={(e) => handleInputChange('workTime', e.target.value)}
                onBlur={() => handleInputBlur('workTime', 1, 1, 600)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restTime">Rest Time (seconds)</Label>
              <Input
                id="restTime"
                type="number"
                inputMode="numeric"
                min="1"
                max="600"
                value={settings.restTime}
                onChange={(e) => handleInputChange('restTime', e.target.value)}
                onBlur={() => handleInputBlur('restTime', 1, 1, 600)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rounds">Rounds</Label>
              <Input
                id="rounds"
                type="number"
                inputMode="numeric"
                min="1"
                max="50"
                value={settings.rounds}
                onChange={(e) => handleInputChange('rounds', e.target.value)}
                onBlur={() => handleInputBlur('rounds', 1, 1, 50)}
              />
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}
