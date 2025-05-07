const { log, json, table } = require('./src/index.js');

// Test the visualization
log('Hello World');
json({ test: 'data' });
table([['A', 'B'], [1, 2]]);

let i = 0
setInterval(() => {
    log(`Log message ${i}`, 'woah')
    i += 1
 }, 1000)