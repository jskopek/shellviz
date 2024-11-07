import './App.scss';
import { useEffect, useState } from 'react';
import Entry from './components/Entry';

function App() {
  const [entries, setEntries] = useState([]);
  const status = 'connecting';
  function deleteEntry({ entry, setEntries }) {
    setEntries((entries) => entries.filter((e) => e.id !== entry.id));
  }

  useEffect(() => {
    setEntries((entries) => {
      const newEntry = {
        id: Date.now(),
        data: [[Math.random()]],
        visualization: 'raw'
      }
      return [newEntry];
    })
  },[])

  return (
    <main className="bg-neutral-100">
      {/* center image using tailwind */}
      <div className="flex items-center max-w-4xl mx-auto px-4 pt-2">
        <div className={`w-4 h-4 rounded-full  bg-${{ 'connecting': 'blue', 'connected': 'green', 'updating': 'yellow', 'error': 'red' }[status]}-500 shadow ms-auto`} title={status}>
          <span className="bg-blue-500 bg-green-500 bg-yellow-500" /> {/* ensure all colors are loaded */}
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {/* add margins to left right and vertical gap for each entry */}
        <div className="flex flex-col gap-4 p-4">

          {entries.map((entry) => (
            <Entry
              key={entry.id}
              id={entry.id}
              data={entry.data}
              visualization={entry.visualization}
              onDelete={() => deleteEntry({ entry, setEntries })}
            >
              {entry}
            </Entry>
          ))}

          {!entries.length && (status === 'connecting') && (
            <div className="flex items-center justify-center my-60">
              <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-orange-500 rounded-full mx-auto" role="status" aria-label="loading">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {!entries.length && (status === 'connected') && (
            <div className="flex items-center justify-center text-sm text-gray-500 my-60">
              Waiting for data...
            </div>
          )}
        </div>

      </div>
    </main >
  );
}

export default App;
