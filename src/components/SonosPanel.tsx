import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
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
      setError('Kon huishoudens niet laden');
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
      setError('Kon speakers niet laden');
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

  if (!isVisible) return null;

  const selectClasses = cn(
    "w-full px-4 py-3 rounded-lg text-base cursor-pointer appearance-none",
    "bg-[#2a2a2a] text-white border border-[#444]",
    "focus:border-[#1db954] focus:outline-none",
    "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center]"
  );

  const sliderClasses = cn(
    "w-full h-2 rounded-full appearance-none cursor-pointer bg-[#333]",
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1db954] [&::-webkit-slider-thumb]:cursor-pointer",
    "[&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] rounded-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#333]">
          <h2 className="text-xl font-semibold text-white">Sonos Instellingen</h2>
          <button 
            className="text-[#888] hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!connected ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-6 text-[#1db954]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="text-[#aaa] mb-6 leading-relaxed">
                Verbind met Sonos om de muziek te kunnen regelen tijdens je training.
              </p>
              <button 
                className={cn(
                  "px-8 py-3.5 rounded-full text-base font-semibold",
                  "bg-gradient-to-br from-[#1db954] to-[#1ed760] text-white",
                  "hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(29,185,84,0.4)]",
                  "transition-all"
                )}
                onClick={handleLogin}
              >
                Verbind met Sonos
              </button>
            </div>
          ) : (
            <>
              {loading && <div className="text-center py-8 text-[#888]">Laden...</div>}
              
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {!loading && households.length > 0 && (
                <>
                  {/* Household selector */}
                  <div className="mb-6">
                    <label className="block text-sm text-[#aaa] font-medium mb-2">Huishouden</label>
                    <select 
                      className={selectClasses}
                      value={selectedHousehold} 
                      onChange={e => handleHouseholdChange(e.target.value)}
                    >
                      {households.map(h => (
                        <option key={h.id} value={h.id}>{h.name || h.id}</option>
                      ))}
                    </select>
                  </div>

                  {/* Group selector */}
                  {groups.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm text-[#aaa] font-medium mb-2">Speaker / Groep</label>
                      <select 
                        className={selectClasses}
                        value={selectedGroup} 
                        onChange={e => handleGroupChange(e.target.value)}
                      >
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Volume slider */}
                  <div className="mb-6">
                    <label className="block text-sm text-[#aaa] font-medium mb-2">
                      Huidig volume: {currentVolume}%
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={currentVolume}
                      onChange={async (e) => {
                        const newVolume = parseInt(e.target.value, 10);
                        setCurrentVolume(newVolume);
                        await setGroupVolume(newVolume, selectedGroup);
                      }}
                      className={sliderClasses}
                      disabled={!selectedGroup}
                    />
                    <div className="flex justify-between mt-2 text-xs text-[#666]">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Playback controls */}
                  <div className="flex justify-center items-center gap-4 mb-6">
                    <button 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "bg-[#333] border border-[#444] text-white",
                        "hover:bg-[#444] hover:border-[#1db954] transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      onClick={() => skipToPreviousTrack(selectedGroup)}
                      disabled={!selectedGroup}
                      title="Vorig nummer"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button 
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center",
                        "bg-[#1db954] border border-[#1db954] text-white",
                        "hover:bg-[#1ed760] hover:scale-105 transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      onClick={async () => {
                        await togglePlayPause(selectedGroup);
                        setIsPlaying(!isPlaying);
                      }}
                      disabled={!selectedGroup}
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                    <button 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "bg-[#333] border border-[#444] text-white",
                        "hover:bg-[#444] hover:border-[#1db954] transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      onClick={() => skipToNextTrack(selectedGroup)}
                      disabled={!selectedGroup}
                      title="Volgend nummer"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Duck level slider */}
                  <div className="mb-6">
                    <label className="block text-sm text-[#aaa] font-medium mb-2">
                      Volume tijdens praten: {duckLevel}%
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={duckLevel}
                      onChange={e => handleDuckLevelChange(parseInt(e.target.value, 10))}
                      className={sliderClasses}
                    />
                    <div className="flex justify-between mt-2 text-xs text-[#666]">
                      <span>Stil</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Test button */}
                  <button 
                    className={cn(
                      "w-full py-3.5 rounded-lg text-sm",
                      "bg-[#333] border border-[#444] text-white",
                      "hover:bg-[#444] transition-colors mb-4",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    onClick={handleVolumeTest}
                    disabled={!selectedGroup}
                  >
                    Test Volume Ducking
                  </button>
                </>
              )}

              {/* Logout button */}
              <button 
                className={cn(
                  "w-full py-3 rounded-lg text-sm",
                  "bg-transparent border border-red-500 text-red-500",
                  "hover:bg-red-500 hover:text-white transition-all"
                )}
                onClick={handleLogout}
              >
                Uitloggen bij Sonos
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function getDuckLevel(): number {
  const saved = localStorage.getItem('sonos_duck_level');
  return saved ? parseInt(saved, 10) : 20;
}
