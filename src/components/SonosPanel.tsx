import { useState, useEffect, useCallback } from 'react';
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
  SonosHousehold, 
  SonosGroup 
} from '../services/sonosApi';
import './SonosPanel.css';

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
  const [error, setError] = useState<string>('');

  // Check initial auth state
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

  // Load households
  const loadHouseholds = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const householdList = await getHouseholds();
      setHouseholds(householdList);
      
      // Restore saved selection or select first
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

  // Load groups for household
  const loadGroups = useCallback(async (householdId: string) => {
    setLoading(true);
    
    try {
      const groupList = await getGroups(householdId);
      setGroups(groupList);
      
      // Restore saved selection or select first
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

  // Load current volume
  const loadVolume = useCallback(async (groupId: string) => {
    const volume = await getGroupVolume(groupId);
    if (volume) {
      setCurrentVolume(volume.volume);
    }
  }, []);

  // Handle Sonos login
  const handleLogin = () => {
    startSonosAuth();
  };

  // Handle logout
  const handleLogout = () => {
    logoutSonos();
    setConnected(false);
    setHouseholds([]);
    setGroups([]);
    setSelectedHousehold('');
    setSelectedGroup('');
    onConnectionChange(false);
  };

  // Handle household change
  const handleHouseholdChange = async (householdId: string) => {
    setSelectedHousehold(householdId);
    saveHouseholdId(householdId);
    await loadGroups(householdId);
  };

  // Handle group change
  const handleGroupChange = async (groupId: string) => {
    setSelectedGroup(groupId);
    saveGroupId(groupId);
    await loadVolume(groupId);
  };

  // Handle duck level change
  const handleDuckLevelChange = (level: number) => {
    setDuckLevel(level);
    localStorage.setItem('sonos_duck_level', level.toString());
  };

  // Handle volume test
  const handleVolumeTest = async () => {
    if (!selectedGroup) return;
    
    const originalVolume = currentVolume;
    
    // Duck to test level
    await setGroupVolume(duckLevel, selectedGroup);
    setCurrentVolume(duckLevel);
    
    // Wait 2 seconds then restore
    setTimeout(async () => {
      await setGroupVolume(originalVolume, selectedGroup);
      setCurrentVolume(originalVolume);
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="sonos-panel-overlay" onClick={onClose}>
      <div className="sonos-panel" onClick={e => e.stopPropagation()}>
        <div className="sonos-panel-header">
          <h2>Sonos Instellingen</h2>
          <button className="sonos-panel-close" onClick={onClose}>×</button>
        </div>

        <div className="sonos-panel-content">
          {!connected ? (
            <div className="sonos-login-section">
              <div className="sonos-logo">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="sonos-login-text">
                Verbind met Sonos om de muziek te kunnen regelen tijdens je training.
              </p>
              <button className="sonos-login-btn" onClick={handleLogin}>
                Verbind met Sonos
              </button>
            </div>
          ) : (
            <>
              {loading && <div className="sonos-loading">Laden...</div>}
              
              {error && <div className="sonos-error">{error}</div>}

              {!loading && households.length > 0 && (
                <>
                  <div className="sonos-form-group">
                    <label>Huishouden</label>
                    <select 
                      value={selectedHousehold} 
                      onChange={e => handleHouseholdChange(e.target.value)}
                    >
                      {households.map(h => (
                        <option key={h.id} value={h.id}>{h.name || h.id}</option>
                      ))}
                    </select>
                  </div>

                  {groups.length > 0 && (
                    <div className="sonos-form-group">
                      <label>Speaker / Groep</label>
                      <select 
                        value={selectedGroup} 
                        onChange={e => handleGroupChange(e.target.value)}
                      >
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sonos-form-group">
                    <label>
                      Volume tijdens praten: {duckLevel}%
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={duckLevel}
                      onChange={e => handleDuckLevelChange(parseInt(e.target.value, 10))}
                      className="sonos-slider"
                    />
                    <div className="sonos-slider-labels">
                      <span>Stil</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className="sonos-form-group">
                    <label>
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
                      className="sonos-slider sonos-volume-slider"
                      disabled={!selectedGroup}
                    />
                    <div className="sonos-slider-labels">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="sonos-playback-controls">
                    <button 
                      className="sonos-playback-btn"
                      onClick={() => skipToPreviousTrack(selectedGroup)}
                      disabled={!selectedGroup}
                      title="Vorig nummer"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                      </svg>
                    </button>
                    <button 
                      className="sonos-playback-btn sonos-play-btn"
                      onClick={() => togglePlayPause(selectedGroup)}
                      disabled={!selectedGroup}
                      title="Play / Pause"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <button 
                      className="sonos-playback-btn"
                      onClick={() => skipToNextTrack(selectedGroup)}
                      disabled={!selectedGroup}
                      title="Volgend nummer"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                      </svg>
                    </button>
                  </div>

                  <button 
                    className="sonos-test-btn"
                    onClick={handleVolumeTest}
                    disabled={!selectedGroup}
                  >
                    Test Volume Ducking
                  </button>
                </>
              )}

              <button className="sonos-logout-btn" onClick={handleLogout}>
                Uitloggen bij Sonos
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export duck level getter for use in other components
export function getDuckLevel(): number {
  const saved = localStorage.getItem('sonos_duck_level');
  return saved ? parseInt(saved, 10) : 20;
}
