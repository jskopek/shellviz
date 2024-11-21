import './App.scss';
import { useEffect, useState } from 'react';
import Entry from './components/Entry';

function App() {
	const [entries, setEntries] = useState([]);

	const [status, setStatus] = useState('connecting') // 'connecting', 'connected', 'updating', 'error'
	function deleteEntry({ entry, setEntries }) {
		setEntries((entries) => entries.filter((e) => e.id !== entry.id));
	}

	useEffect(() => {
		// Initialize entries from existing server values
		if (window.__INITIAL_ENTRIES__) {
			setEntries(window.__INITIAL_ENTRIES__);
		}
	}, [])

	// set up websocket connection
	useEffect(() => {
		let ws;
		let retryTimeout;
		let retryInterval = 1000;  // Initial retry interval for websocket

		const connectWebSocket = () => {
			setStatus('connecting');
			// console.log('Attempting to connect to WebSocket');
			const port = parseInt(new URLSearchParams(window.location.search).get('port')) || (parseInt(window.location.port) + 1 || 5545)
			ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

			ws.onopen = function () {
				// console.log("Connected to WebSocket server");
				retryInterval = 1000;  // Reset the retry interval on a successful connection
				setStatus('connected');
			};

			ws.onmessage = function (event) {
				const entry = JSON.parse(event.data)

				if(entry.data === '___clear___'){
					// if a special ___clear___ event is sent, empty the messages
					setEntries([]);
					return;
				}

				setEntries((entries) => {
					// Update the entry if it already exists, otherwise add it
					const entryMap = new Map(entries.map(e => [e.id, e]));
					entryMap.set(entry.id, entry);
					return Array.from(entryMap.values());
				});
			};

			ws.onclose = function () {
				// console.log("WebSocket connection closed. Reconnecting...");
				// Retry with an increasing delay (exponential backoff)
				retryTimeout = setTimeout(() => {
					retryInterval = Math.min(retryInterval * 2, 10000);  // Double the retry interval, with a max of 10 seconds
					connectWebSocket();
				}, retryInterval);
				setStatus('connecting');
			};

			ws.onerror = function (error) {
				setStatus('error');
				// console.error("WebSocket error:", error);
				ws.close();
			};
		};

		connectWebSocket();

		// Cleanup function to close WebSocket and clear any retry timeouts when component unmounts
		return () => {
			if (ws) ws.close();
			clearTimeout(retryTimeout);
		};
	}, []);

	// handle scrolling/ scroll to bottom when new entry is added unless user has scrolled up
	const [atBottom, setAtBottom] = useState(true);
	useEffect(() => {
		// add an event listener for scrolling that sets atBottom if the user can see the bottom of the page
		window.addEventListener('scroll', () => {
			const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight
			setAtBottom(atBottom)
		})
	}, []);

	// if the user is at the bottom of the page, scroll to the bottom when a new entry is added
	useEffect(() => {
		if (atBottom) {
			window.scrollTo(0, document.body.scrollHeight);
		}
	}, [entries, atBottom]);

	return (
		<main className="">
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
							view={entry.view}
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
