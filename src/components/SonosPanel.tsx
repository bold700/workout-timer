import { useState, useEffect, useCallback } from 'react';
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SkipBack, Play, Pause, SkipForward, Volume2, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { 
  isAuthenticated, 
  startSonosAuth, 
  logoutSonos,
  saveHouseholdId,
  saveGroupId,
  getHouseholdId,
  getGroupId 
} from '../services/sonosAuth';
import { 
  getHouseholds, 
  getGroups, 
  getGroupVolume,
  setGroupVolume,
  skipToNextTrack,
  skipToPreviousTrack,
  togglePlayPause,
  getPlaybackStatus,
  SonosHousehold, 
  SonosGroup 
} from '../services/sonosApi';

interface SonosPanelProps {
  onClose?: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export default function SonosPanel({ onConnectionChange }: SonosPanelProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [households, setHouseholds] = useState<SonosHousehold[]>([]);
  const [groups, setGroups] = useState<SonosGroup[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [currentVolume, setCurrentVolume] = useState<number>(50);
  const [duckLevel, setDuckLevel] = useState<number>(() => {
    const saved = localStorage.getItem('sonos_duck_level');
    return saved ? parseInt(saved, 10) : 20;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        setConnected(true);
        onConnectionChange(true);
        await loadHouseholds();
      }
    };
    checkAuth();
  }, []);

  const loadHouseholds = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const householdList = await getHouseholds();
      setHouseholds(householdList);
      
      const savedHousehold = getHouseholdId();
      if (savedHousehold && householdList.some(h => h.id === savedHousehold)) {
        setSelectedHousehold(savedHousehold);
        await loadGroups(savedHousehold);
      } else if (householdList.length > 0) {
        setSelectedHousehold(householdList[0].id);
        saveHouseholdId(householdList[0].id);
        await loadGroups(householdList[0].id);
      }
    } catch (err) {
      setError('Could not load households');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async (householdId: string) => {
    setLoading(true);
    
    try {
      const groupList = await getGroups(householdId);
      setGroups(groupList);
      
      const savedGroup = getGroupId();
      if (savedGroup && groupList.some(g => g.id === savedGroup)) {
        setSelectedGroup(savedGroup);
        await loadVolume(savedGroup);
      } else if (groupList.length > 0) {
        setSelectedGroup(groupList[0].id);
        saveGroupId(groupList[0].id);
        await loadVolume(groupList[0].id);
      }
    } catch (err) {
      setError('Could not load speakers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVolume = useCallback(async (groupId: string) => {
    const volume = await getGroupVolume(groupId);
    if (volume) {
      setCurrentVolume(volume.volume);
    }
    
    const status = await getPlaybackStatus(groupId);
    if (status) {
      setIsPlaying(status.playbackState === 'PLAYBACK_STATE_PLAYING');
    }
  }, []);

  const handleLogin = () => startSonosAuth();

  const handleLogout = () => {
    logoutSonos();
    setConnected(false);
    setHouseholds([]);
    setGroups([]);
    setSelectedHousehold('');
    setSelectedGroup('');
    onConnectionChange(false);
  };

  const handleHouseholdChange = async (householdId: string) => {
    setSelectedHousehold(householdId);
    saveHouseholdId(householdId);
    await loadGroups(householdId);
  };

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroup(groupId);
    saveGroupId(groupId);
    await loadVolume(groupId);
  };

  const handleDuckLevelChange = (value: number[]) => {
    const level = value[0];
    setDuckLevel(level);
    localStorage.setItem('sonos_duck_level', level.toString());
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setCurrentVolume(newVolume);
    await setGroupVolume(newVolume, selectedGroup);
  };

  const handleVolumeTest = async () => {
    if (!selectedGroup) return;
    const originalVolume = currentVolume;
    await setGroupVolume(duckLevel, selectedGroup);
    setCurrentVolume(duckLevel);
    setTimeout(async () => {
      await setGroupVolume(originalVolume, selectedGroup);
      setCurrentVolume(originalVolume);
    }, 2000);
  };

  return (
    <DialogContent className="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Sonos Settings
        </DialogTitle>
        <DialogDescription>
          {connected 
            ? "Control your Sonos speakers and adjust volume settings."
            : "Connect with Sonos to control your music during workouts."
          }
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 min-w-0">
        {!connected ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <Volume2 className="h-12 w-12 text-muted-foreground" />
            <Button onClick={handleLogin} className="w-full">
              Connect to Sonos
            </Button>
          </div>
        ) : (
          <>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!loading && households.length > 0 && (
              <div className="grid gap-4 min-w-0">
                {/* Household selector */}
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="household">Household</Label>
                  <Select value={selectedHousehold} onValueChange={handleHouseholdChange}>
                    <SelectTrigger id="household" className="w-full">
                      <SelectValue placeholder="Select household" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-w-[var(--radix-select-trigger-width)]">
                      {households.map(h => (
                        <SelectItem key={h.id} value={h.id} className="truncate">
                          {h.name || h.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Group selector */}
                {groups.length > 0 && (
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="speaker">Speaker / Group</Label>
                    <Select value={selectedGroup} onValueChange={handleGroupChange}>
                      <SelectTrigger id="speaker" className="w-full">
                        <SelectValue placeholder="Select speaker" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Volume control */}
                <div className="grid gap-3">
                  <Label>Current Volume: {currentVolume}%</Label>
                  <Slider
                    value={[currentVolume]}
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={100}
                    step={1}
                    disabled={!selectedGroup}
                  />
                </div>

                {/* Playback controls */}
                <div className="flex justify-center items-center gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => skipToPreviousTrack(selectedGroup)}
                    disabled={!selectedGroup}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon-lg"
                    onClick={async () => {
                      await togglePlayPause(selectedGroup);
                      setIsPlaying(!isPlaying);
                    }}
                    disabled={!selectedGroup}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => skipToNextTrack(selectedGroup)}
                    disabled={!selectedGroup}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                {/* Duck level */}
                <div className="grid gap-3">
                  <Label>Volume while talking: {duckLevel}%</Label>
                  <Slider
                    value={[duckLevel]}
                    onValueChange={handleDuckLevelChange}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Test button */}
                <Button 
                  variant="secondary"
                  onClick={handleVolumeTest}
                  disabled={!selectedGroup}
                >
                  Test Volume Ducking
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {connected && (
        <DialogFooter>
          <Button 
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Disconnect Sonos
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}

export function getDuckLevel(): number {
  const saved = localStorage.getItem('sonos_duck_level');
  return saved ? parseInt(saved, 10) : 20;
}
