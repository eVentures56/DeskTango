import { useEffect, useState } from 'react';
import './App.css';

interface Monitor {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
}

interface WindowState {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
}

interface Scenario {
  name: string;
  windows: WindowState[];
}

function App() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [currentMonitorId, setCurrentMonitorId] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    // Load monitors
    window.deskTango.getMonitors()
      .then((result) => {
        console.log('Monitors received:', JSON.stringify(result, null, 2));
        setMonitors(result);

        // Determine initial monitor based on window position
        window.deskTango.moveWindow(1, null) // Pass null to get current window bounds
          .then(response => {
            if (response.success && response.bounds) {
              const initialMonitor = result.find(m =>
                m.bounds.x === response.bounds.x &&
                m.bounds.y === response.bounds.y
              )?.id;
              setCurrentMonitorId(initialMonitor || null);
              console.log('Initial monitor ID:', initialMonitor);
            }
          })
          .catch(err => console.error('Failed to get initial position:', err));
      })
      .catch(err => console.error('Failed to get monitors:', err));

    // Load existing scenarios
    window.deskTango.loadScenarios() // New method to load all scenarios
      .then((loadedScenarios) => {
        if (loadedScenarios.success) {
          setScenarios(loadedScenarios.scenarios || []);
          console.log('Loaded scenarios:', JSON.stringify(loadedScenarios.scenarios, null, 2));
        }
      })
      .catch(err => console.error('Failed to load scenarios:', err));
  }, []);

  const handleMonitorClick = (monitorId: number) => {
    window.deskTango.moveWindow(1, monitorId)
      .then(response => {
        if (response.success) {
          console.log('Window moved successfully');
          setCurrentMonitorId(monitorId); // Update current monitor ID after successful move
        } else {
          console.error('Move failed:', response.error);
        }
      })
      .catch(err => console.error('Move window error:', err));
  };

  const saveScenario = (name: string) => {
    window.deskTango.saveScenario(name)
      .then(result => {
        console.log(`Scenario ${name} saved:`, JSON.stringify(result, null, 2));
        if (result.success) {
          setScenarios(prev => {
            const filtered = prev.filter(scenario => scenario.name !== name); // Remove old scenario with same name
            return [...filtered, { name, windows: result.windows }];
          });
        }
      })
      .catch(err => console.error(`Failed to save ${name}:`, err));
  };

  const loadScenario = (name: string) => {
    const scenario = scenarios.find(s => s.name === name);
    if (scenario) {
      const monitorId = monitors.find(m => 
        m.bounds.x === scenario.windows[0].bounds.x &&
        m.bounds.y === scenario.windows[0].bounds.y
      )?.id;
      if (monitorId) {
        window.deskTango.loadScenario(name)
          .then(() => {
            console.log(`Scenario ${name} loaded`);
            setCurrentMonitorId(monitorId); // Update current monitor ID after loading
          })
          .catch(err => console.error(`Failed to load ${name}:`, err));
      } else {
        console.error(`Monitor not found for scenario ${name}`);
      }
    } else {
      console.error(`Scenario ${name} not found in state`);
    }
  };

  return (
    <div className="app-container">
      <h1>DeskTango</h1>
      <h2>Move DeskTango to Monitor</h2>
      <div className="monitor-buttons">
        {monitors.map(monitor => (
          <button
            key={monitor.id}
            onClick={() => handleMonitorClick(monitor.id)}
            disabled={currentMonitorId === monitor.id} // Disable if current monitor
          >
            Monitor {monitor.id} ({monitor.bounds.width}x{monitor.bounds.height})
          </button>
        ))}
      </div>
      <div className="scenario-buttons">
        <button onClick={() => saveScenario('Work')}>Save Work</button>
        <button onClick={() => saveScenario('Play')}>Save Play</button>
        <button onClick={() => saveScenario('Focus')}>Save Focus</button>
        <button onClick={() => loadScenario('Work')}>Load Work</button>
        <button onClick={() => loadScenario('Play')}>Load Play</button>
        <button onClick={() => loadScenario('Focus')}>Load Focus</button>
      </div>
      <div className="scenario-list">
        <h3>Saved Scenarios:</h3>
        <ul>
          {scenarios.map((scenario, index) => (
            <li key={index}>{scenario.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;