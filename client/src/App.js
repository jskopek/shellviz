import './App.scss';
import { useEffect, useState } from 'react';
import Entry from './components/Entry';

function App() {
	const [entries, setEntries] = useState([]);
	const [retryInterval, setRetryInterval] = useState(1000);  // Initial retry interval for websocket

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
	}, [])

	// set up websocket connection
	useEffect(() => {
		let ws;
		let retryTimeout;

		const connectWebSocket = () => {
			console.log('Attempting to connect to WebSocket');
			ws = new WebSocket("ws://" + window.location.hostname + ":" + (parseInt(window.location.port) + 1 || 5545));

			ws.onopen = function () {
				console.log("Connected to WebSocket server");
				setRetryInterval(1000);  // Reset the retry interval on a successful connection
			};

			ws.onmessage = function (event) {
				const messageDiv = document.createElement("div");
				messageDiv.textContent = event.data;
				document.getElementById("messages").appendChild(messageDiv);

				setEntries((entries) => {
					const newEntry = {
						id: Date.now(),
						data: event.data,
						visualization: 'raw'
					};
					return [...entries, newEntry];
				});
			};

			ws.onclose = function () {
				console.log("WebSocket connection closed. Reconnecting...");
				// Retry with an increasing delay (exponential backoff)
				retryTimeout = setTimeout(() => {
					setRetryInterval(prev => Math.min(prev * 2, 30000));  // Max delay of 30 seconds
					connectWebSocket();
				}, retryInterval);
			};

			ws.onerror = function (error) {
				console.error("WebSocket error:", error);
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
	}, [entries]);

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
