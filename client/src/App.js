import './App.scss';
import { useEffect, useState, useRef } from 'react';
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
			let port = parseInt(new URLSearchParams(window.location.search).get('port')) || (parseInt(window.location.port) + 1 || 5545)
			if (window.location.port === '3000') {
				console.warn('Development port detected (3000). Using default websocket port 5545. To override, add ?port=XXXX to the URL');
				port = 5545;
			}
			ws = new WebSocket("ws://" + window.location.hostname + ":" + port);

			ws.onopen = function () {
				// console.log("Connected to WebSocket server");
				retryInterval = 1000;  // Reset the retry interval on a successful connection
				setStatus('connected');
			};

			ws.onmessage = function (event) {
				const entry = JSON.parse(event.data)

				if (entry.data === '___clear___') {
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

	/* Handle auto-scrolling */
	const [atBottom, setAtBottom] = useState(true);
	const isProgrammaticScrollRef = useRef(false);
	useEffect(() => {
		const handleScroll = () => {
			if (isProgrammaticScrollRef.current) {
				return; // Ignore scroll events triggered programmatically
			}

			// Check if the user is at the bottom
			const atBottom =
				window.innerHeight + window.scrollY >= document.body.scrollHeight - 1; // Add a small tolerance to avoid precision issues
			setAtBottom(atBottom);
		};

		// Add event listener for scroll
		window.addEventListener("scroll", handleScroll);

		return () => {
			// Cleanup event listener on unmount
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);
	useEffect(() => {
		if (atBottom) {
			isProgrammaticScrollRef.current = true; // Set the flag before programmatic scrolling
			setTimeout(() => {
				window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
				isProgrammaticScrollRef.current = false; // Reset the flag after scroll
			}, 0);
		}
	}, [entries, atBottom]);
	/* / Handle auto-scrolling */

	return (
		<main className="">
			{/* center image using tailwind */}
			<div className="fixed bottom-2 left-2 z-10">
				<div className={`w-4 h-4 rounded-full  bg-${{ 'connecting': 'blue', 'connected': 'green', 'updating': 'yellow', 'error': 'red' }[status]}-500 shadow ms-auto`} title={status}>
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
