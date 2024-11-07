// script.js
const ws = new WebSocket("ws://" + window.location.hostname + ":" + (parseInt(window.location.port) + 1 || 5545));

ws.onmessage = function(event) {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = event.data;
    document.getElementById("messages").appendChild(messageDiv);
};

ws.onopen = function() {
    console.log("Connected to WebSocket server");
};

ws.onclose = function() {
    console.log("WebSocket connection closed");
};
