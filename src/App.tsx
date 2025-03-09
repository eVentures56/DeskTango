import React, { useEffect, useState } from 'react';
import { Display } from 'electron';

const App: React.FC = () => {
  const [monitors, setMonitors] = useState<Display[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent updates if unmounted
    const fetchMonitors = async () => {
      try {
        console.log('Window deskTango:', window.deskTango);
        if (typeof window.deskTango === 'undefined') {
          throw new Error('deskTango is not available - check preload.js');
        }
        console.log('Attempting to fetch monitors...');
        const monitorsData = await window.deskTango.getMonitors();
        if (isMounted) {
          console.log('Monitors fetched:', monitorsData);
          setMonitors(monitorsData);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching monitors:', err);
          setError(err instanceof Error ? err.message : 'Failed to load monitors');
        }
      }
    };

    fetchMonitors();
    return () => { isMounted = false; }; // Cleanup
  }, []);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h1>DeskTango Monitors</h1>
      {monitors.length > 0 ? (
        monitors.map((monitor, index) => (
          <button key={index} style={{ margin: '5px', padding: '10px' }}>
            Monitor {index + 1} ({monitor.size.width}x{monitor.size.height})
          </button>
        ))
      ) : (
        <p>Loading monitors...</p>
      )}
    </div>
  );
};

export default App;