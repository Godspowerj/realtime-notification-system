const { io } = require('socket.io-client');
const axios = require('axios');

const NUM_USERS = 5000; // Let's start with 5k so we don't completely freeze your PC instantly
const SERVER_URL = 'http://localhost:3000';

let connectedCount = 0;
let messagesSent = 0;

console.log(`🚀 Starting load test for ${NUM_USERS} users...`);

async function runLoadTest() {
    const clients = [];

    // 1. Establish WebSocket Connections
    console.log('🔗 Connecting sockets...');
    for (let i = 0; i < NUM_USERS; i++) {
        const socket = io(SERVER_URL, { transports: ['websocket'] });
        
        socket.on('connect', () => {
            connectedCount++;
            if (connectedCount % 500 === 0) {
                console.log(`✅ ${connectedCount} sockets connected...`);
            }
        });

        socket.on('connect_error', (err) => {
            console.error(`❌ Connection Error for user ${i}:`, err.message);
        });

        clients.push(socket);
        
        // Slight delay to prevent immediate ECONNREFUSED from OS TCP limits
        if (i % 100 === 0) await new Promise(r => setTimeout(r, 50)); 
    }

    console.log('⏳ Waiting for all sockets to connect...');
    await new Promise(r => setTimeout(r, 5000));

    // 2. Fire 20k Requests (Each user sends multiple messages)
    console.log('\n🔥 Initiating HTTP POST /notify storm...');
    
    const startTime = Date.now();
    const requests = [];

    // Let's send 10k messages across our connected users
    for (let i = 0; i < 10000; i++) {
        requests.push(
            axios.post(`${SERVER_URL}/notify`, {
                message: `Load test message ${i} from simulated user`
            }).then(() => {
                messagesSent++;
                if (messagesSent % 1000 === 0) {
                    console.log(`📤 ${messagesSent} messages queued...`);
                }
            }).catch(err => {
                console.error(`🚨 HTTP Error: ${err.message}`);
            })
        );
        
        // Small batching so we don't run out of memory in the test script itself
        if (i % 1000 === 0) await new Promise(r => setTimeout(r, 100)); 
    }

    await Promise.all(requests);
    
    const endTime = Date.now();
    console.log(`\n🏁 Test completed! Sent 10,000 messages in ${(endTime - startTime)/1000} seconds.`);
    console.log('Keep the script running to watch sockets receive the jobCompleted events...');
}

runLoadTest().catch(console.error);
