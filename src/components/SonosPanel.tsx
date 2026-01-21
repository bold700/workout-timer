import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { SkipBack, Play, Pause, SkipForward, Volume2, LogOut } from 'lucide-react';
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
  isVisible: boolean;
  onClose: () => void;
  onConnectionChange: (connected: boolean) => void;
}

export default function SonosPanel({ isVisible, onClose, onConnectionChange }: SonosPanelProps) {
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

  const handleDuckLevelChange = (level: number) => {
    setDuckLevel(level);
    localStorage.setItem('sonos_duck_level', level.toString());
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
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sonos Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {!connected ? (
            <div className="text-center py-4">
              <Volume2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-6">
                Connect with Sonos to control your music during workouts.
              </p>
              <Button variant="sonos" onClick={handleLogin} className="w-full">
                Connect to Sonos
              </Button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              )}
              
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {!loading && households.length > 0 && (
                <>
                  <Select
                    label="Household"
                    value={selectedHousehold} 
                    onChange={e => handleHouseholdChange(e.target.value)}
                  >
                    {households.map(h => (
                      <option key={h.id} value={h.id}>{h.name || h.id}</option>
                    ))}
                  </Select>

                  {groups.length > 0 && (
                    <Select
                      label="Speaker / Group"
                      value={selectedGroup} 
                      onChange={e => handleGroupChange(e.target.value)}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </Select>
                  )}

                  {/* Volume control */}
                  <div className="grid gap-2">
                    <Slider
                      label={`Current Volume: ${currentVolume}%`}
                      min={0}
                      max={100}
                      value={currentVolume}
                      onChange={async (e) => {
                        const newVolume = parseInt(e.target.value, 10);
                        setCurrentVolume(newVolume);
                        await setGroupVolume(newVolume, selectedGroup);
                      }}
                      disabled={!selectedGroup}
                    />
                  </div>

                  {/* Playback controls */}
                  <div className="flex justify-center items-center gap-2">
                    <Button 
                      variant="secondary"
                      size="icon-lg"
                      onClick={() => skipToPreviousTrack(selectedGroup)}
                      disabled={!selectedGroup}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="sonos"
                      size="icon-xl"
                      onClick={async () => {
                        await togglePlayPause(selectedGroup);
                        setIsPlaying(!isPlaying);
                      }}
                      disabled={!selectedGroup}
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </Button>
                    <Button 
                      variant="secondary"
                      size="icon-lg"
                      onClick={() => skipToNextTrack(selectedGroup)}
                      disabled={!selectedGroup}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Duck level */}
                  <div className="grid gap-2">
                    <Slider
                      label={`Volume while talking: ${duckLevel}%`}
                      min={0}
                      max={50}
                      value={duckLevel}
                      onChange={e => handleDuckLevelChange(parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* Test button */}
                  <Button 
                    variant="secondary"
                    onClick={handleVolumeTest}
                    disabled={!selectedGroup}
                    className="w-full"
                  >
                    Test Volume Ducking
                  </Button>
                </>
              )}

              {/* Logout */}
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Sonos
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getDuckLevel(): number {
  const saved = localStorage.getItem('sonos_duck_level');
  return saved ? parseInt(saved, 10) : 20;
}
