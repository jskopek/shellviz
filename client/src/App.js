import './App.scss';
import { useEffect, useState, useRef } from 'react';
import Entry from './components/Entry';

const VERSION = '0.1.0';

function App() {
	// get the hostname and port from the URL
	const hostname = window.location.hostname;
	let port = parseInt(new URLSearchParams(window.location.search).get('port')) || (parseInt(window.location.port) || 5544)
	if (port === 3000) {
		console.warn('Development port detected (3000). Using default websocket port 5544. To override, add ?port=XXXX to the URL');
		port = 5544;
	}

	const [entries, setEntries] = useState([]);

	const [status, setStatus] = useState('connecting') // 'connecting', 'connected', 'updating', 'error'
	
	// Use ref to avoid stale closures in polling
	const entriesRef = useRef(entries);
	entriesRef.current = entries;
	
	// Detect embedded mode immediately - don't wait for server check
	const [isEmbedded, setIsEmbedded] = useState(() => {
		const embedded = window.__shellvizLocalData !== undefined;
		if (embedded) {
			console.log('Embedded mode detected immediately');
		}
		return embedded;
	});
	
	function deleteEntry({ entry, setEntries }) {
		setEntries((entries) => entries.filter((e) => e.id !== entry.id));
		
		if (isEmbedded) {
			// In embedded mode, also remove from local storage
			if (window.__shellvizLocalData) {
				window.__shellvizLocalData = window.__shellvizLocalData.filter((e) => e.id !== entry.id);
			}
		} else {
			// Normal server mode
			fetch(`http://${hostname}:${port}/api/delete/${entry.id}`, { method: 'DELETE', });
		}
	}
	
	function clearEntries() {
		setEntries([]);
		
		if (isEmbedded) {
			// Clear local data in embedded mode
			if (window.__shellvizLocalData) {
				window.__shellvizLocalData = [];
			}
		} else {
			// Normal server mode
			fetch(`http://${hostname}:${port}/api/clear`, { method: 'DELETE' });
		}
	}

	// Set up embedded event listeners FIRST - before any server checks
	useEffect(() => {
		if (isEmbedded) {
			console.log('Setting up embedded mode event listeners');
			
			// Try polling approach for more reliability
			let pollInterval;
			let lastDataLength = 0;
			let lastDataString = '';
			
			const pollForData = () => {
				const currentData = window.__shellvizLocalData || [];
				const currentDataString = JSON.stringify(currentData);
				if (currentData.length !== lastDataLength || currentDataString !== lastDataString) {
					console.log('Polling detected data change:', currentData.length, 'entries');
					console.log('Setting entries via polling to:', currentData);
					setEntries([...currentData]); // Force new array reference
					lastDataLength = currentData.length;
					lastDataString = currentDataString;
				}
			};
			
			// Poll every 100ms for data changes
			pollInterval = setInterval(pollForData, 100);
			
			// Also keep the event listeners as backup
			const handleDataUpdate = (event) => {
				console.log('Event: Received data update:', event.detail);
				console.log('Event: Setting entries to:', event.detail.entries);
				// Force new array reference to trigger re-render
				setEntries([...event.detail.entries]);
			};

			const handleDataClear = () => {
				console.log('Event: Received data clear');
				setEntries([]);
			};

			// Listen for custom events from the client
			window.addEventListener('shellviz:dataUpdate', handleDataUpdate);
			window.addEventListener('shellviz:dataClear', handleDataClear);
			
			// Load any existing data immediately
			if (window.__shellvizLocalData && window.__shellvizLocalData.length > 0) {
				console.log('Loading existing local data:', window.__shellvizLocalData);
				setEntries([...window.__shellvizLocalData]); // Force new array reference
			}
			
			setStatus('connected');

			// Cleanup
			return () => {
				if (pollInterval) clearInterval(pollInterval);
				window.removeEventListener('shellviz:dataUpdate', handleDataUpdate);
				window.removeEventListener('shellviz:dataClear', handleDataClear);
			};
		}
	}, [isEmbedded]);

	// Only try server connection if not in embedded mode
	useEffect(() => {
		if (isEmbedded) {
			console.log('Skipping server connection - in embedded mode');
			return;
		}
		
		console.log(`Shellviz Client v${VERSION} initializing on http://${hostname}:${port}`);
		
		// Try to load from server
		fetch(`http://${hostname}:${port}/api/entries`)
			.then(res => res.json())
			.then(data => {
				setEntries(data);
				setStatus('connected');
			})
			.catch(err => {
				console.log('Server not available, checking for embedded mode...');
				// Server not available, check if we can switch to embedded mode
				if (window.__shellvizLocalData !== undefined) {
					console.log('Switching to embedded mode after server failed');
					setIsEmbedded(true);
				} else {
					console.error('No server and no embedded data available:', err);
					setStatus('error');
				}
			});
	}, [hostname, port, isEmbedded]);

	// Set up websocket connection (only if not embedded)
	useEffect(() => {
		if (isEmbedded) {
			return; // Skip WebSocket in embedded mode
		}
		
		// Normal mode: WebSocket connection
		let ws;
		let retryTimeout;
		let retryInterval = 1000;  // Initial retry interval for websocket

		const connectWebSocket = () => {
			setStatus('connecting');
			ws = new WebSocket("ws://" + hostname + ":" + port);

			ws.onopen = function () {
				// console.log("Connected to WebSocket server");
				retryInterval = 1000;  // Reset the retry interval on a successful connection
				setStatus('connected');
			};

			ws.onmessage = function (event) {
				const entry = JSON.parse(event.data)

				setEntries((entries) => {
					// Update the entry if it already exists, otherwise add it
					const entryMap = new Map(entries.map(e => [e.id, e]));
					entryMap.set(entry.id, entry);
					return Array.from(entryMap.values());
				});

				if (entry.data === '___clear___') {
					// if a special ___clear___ event is sent, empty the messages
					setEntries([]);
				}
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
	}, [hostname, port, isEmbedded]);

	/* Handle auto-scrolling */
	const [atBottom, setAtBottom] = useState(true);

	// Listen for scrolls
	useEffect(() => {
		const handleScroll = () => {
			const container = document.getElementById('shellviz-app-root');
			if (container) {
				// We're in a widget, check widget scroll
				const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
				setAtBottom(atBottom);
			} else {
				// Normal full page mode
				const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
				setAtBottom(atBottom);
			}
		};
		
		const scrollTarget = document.getElementById('shellviz-app-root') || window;
		scrollTarget.addEventListener("scroll", handleScroll);
		return () => scrollTarget.removeEventListener("scroll", handleScroll);
	}, []);

	// When entries change, scroll if user was at bottom
	useEffect(() => {
		if (atBottom) {
			const container = document.getElementById('shellviz-app-root');
			if (container) {
				container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
			} else {
				window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
			}
		}
	}, [atBottom, entries]);

	/* / Handle auto-scrolling */

	useEffect(() => {
		console.log('entries updated', entries)
	}, [entries])
	console.log('about to render', entries)
	return (
		<main className="">
			{/* center image using tailwind */}
			<div className="fixed bottom-2 left-2 z-10">
				<div className={`w-4 h-4 rounded-full  bg-${{ 'connecting': 'blue', 'connected': 'green', 'updating': 'yellow', 'error': 'red' }[status]}-500 shadow ms-auto`} title={isEmbedded ? 'embedded mode' : status} onClick={() => { clearEntries(); }}>
					<span className="bg-blue-500 bg-green-500 bg-yellow-500" /> {/* ensure all colors are loaded */}
				</div>
			</div>
			<div className="">
				{/* add margins to left right and vertical gap for each entry */}
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
					<div className="flex items-center justify-center h-screen">
						<div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-gray-400 rounded-full mx-auto" role="status" aria-label="loading">
							<span className="sr-only">Loading...</span>
						</div>
					</div>
				)}

				{!entries.length && (status === 'connected') && (
					<div className="flex items-center justify-center text-sm text-gray-400 h-screen">
						{isEmbedded ? 'Waiting for data... (embedded mode)' : 'Waiting for data...'}
					</div>
				)}
			</div>

		</main >
	);
}

export default App;
