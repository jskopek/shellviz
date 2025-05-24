import './App.scss';
import { useEffect, useState } from 'react';
import Entry from './components/Entry';

const VERSION = '0.1.1';

function App() {
	// Check for global configuration from widget, otherwise use URL-based detection
	const config = window.__shellvizConfig || {};
	
	// get the hostname and port from config or URL
	const hostname = config.hostname || window.location.hostname;
	let port = config.port || parseInt(new URLSearchParams(window.location.search).get('port')) || (parseInt(window.location.port) || 5544);
	
	if (port === 3000 && !config.port) {
		console.warn('Development port detected (3000). Using default websocket port 5544. To override, add ?port=XXXX to the URL');
		port = 5544;
	}

	const [entries, setEntries] = useState([]);
	const [status, setStatus] = useState('connecting') // 'connecting', 'connected', 'updating', 'error'
	
	function deleteEntry({ entry, setEntries }) {
		setEntries((entries) => entries.filter((e) => e.id !== entry.id));
		fetch(`http://${hostname}:${port}/api/delete/${entry.id}`, { method: 'DELETE', });
	}
	
	function clearEntries() {
		setEntries([]);
		fetch(`http://${hostname}:${port}/api/clear`, { method: 'DELETE' });
	}

	useEffect(() => {
		console.log(`Shellviz Client v${VERSION} initializing on http://${hostname}:${port}`);
		
		fetch(`http://${hostname}:${port}/api/entries`)
			.then(res => res.json())
			.then(data => {
				setEntries(data);
				setStatus('connected');
			})
			.catch(err => {
				console.error('Failed to connect to server:', err);
				setStatus('error');
			});
	}, [hostname, port])

	// set up websocket connection
	useEffect(() => {
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
	}, [hostname, port]);

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
				container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
			}
		}
	}, [atBottom, entries]);

	/* / Handle auto-scrolling */

	return (
		<main className="">
			{/* center image using tailwind */}
			<div className="fixed bottom-2 left-2 z-10">
				<div className={`w-4 h-4 rounded-full  bg-${{ 'connecting': 'blue', 'connected': 'green', 'updating': 'yellow', 'error': 'red' }[status]}-500 shadow ms-auto`} title={status} onClick={() => { clearEntries(); }}>
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
						Waiting for data...
					</div>
				)}
			</div>

		</main >
	);
}

export default App;
