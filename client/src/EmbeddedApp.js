import './App.scss';
import { useEffect, useState } from 'react';
import Entry from './components/Entry';

const VERSION = '0.1.0';

function EmbeddedApp() {
	const [entries, setEntries] = useState([]);
	const [status, setStatus] = useState('connected'); // In embedded mode, we're always "connected"
	
	// Check if we're running in embedded mode
	const isEmbedded = window.__shellvizLocalData !== undefined || 
	                   window.location.pathname === '/embedded' ||
	                   window.parent !== window; // Running in iframe/widget

	function deleteEntry({ entry, setEntries }) {
		setEntries((entries) => entries.filter((e) => e.id !== entry.id));
		
		// In embedded mode, also remove from local storage
		if (isEmbedded && window.__shellvizLocalData) {
			window.__shellvizLocalData = window.__shellvizLocalData.filter((e) => e.id !== entry.id);
		}
	}

	function clearEntries() {
		setEntries([]);
		
		// In embedded mode, clear local storage
		if (isEmbedded) {
			if (window.__shellvizLocalData) {
				window.__shellvizLocalData = [];
			}
			// Also trigger the clear event for the client
			window.dispatchEvent(new CustomEvent('shellviz:dataClear'));
		}
	}

	// Load initial data
	useEffect(() => {
		console.log(`Shellviz Embedded Client v${VERSION} initializing`);
		
		if (isEmbedded) {
			// Load from local data if available
			if (window.__shellvizLocalData) {
				setEntries(window.__shellvizLocalData);
			}
		}
	}, [isEmbedded]);

	// Set up event listeners for embedded mode
	useEffect(() => {
		if (!isEmbedded) return;

		const handleDataUpdate = (event) => {
			console.log('Received data update:', event.detail);
			setEntries(event.detail.entries);
		};

		const handleDataClear = () => {
			console.log('Received data clear');
			setEntries([]);
		};

		// Listen for custom events from the client
		window.addEventListener('shellviz:dataUpdate', handleDataUpdate);
		window.addEventListener('shellviz:dataClear', handleDataClear);

		// Cleanup
		return () => {
			window.removeEventListener('shellviz:dataUpdate', handleDataUpdate);
			window.removeEventListener('shellviz:dataClear', handleDataClear);
		};
	}, [isEmbedded]);

	/* Handle auto-scrolling */
	const [atBottom, setAtBottom] = useState(true);

	// Listen for scrolls - but only within the widget container
	useEffect(() => {
		const handleScroll = (event) => {
			// Check if we're in a widget container
			const container = document.getElementById('shellviz-app-root') || document.body;
			const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
			setAtBottom(atBottom);
		};

		const container = document.getElementById('shellviz-app-root') || window;
		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	// When entries change, scroll if user was at bottom
	useEffect(() => {
		if (atBottom) {
			const container = document.getElementById('shellviz-app-root');
			if (container) {
				container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
			} else {
				window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
			}
		}
	}, [atBottom, entries]);

	/* / Handle auto-scrolling */

	return (
		<main className="">
			{/* Status indicator - show embedded mode */}
			<div className="fixed bottom-2 left-2 z-10">
				<div 
					className={`w-4 h-4 rounded-full bg-green-500 shadow ms-auto`} 
					title={isEmbedded ? 'embedded mode' : status} 
					onClick={() => { clearEntries(); }}
				>
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

				{!entries.length && (
					<div className="flex items-center justify-center text-sm text-gray-400 h-screen">
						{isEmbedded ? 'Waiting for data...' : 'Embedded mode ready'}
					</div>
				)}
			</div>
		</main>
	);
}

export default EmbeddedApp; 