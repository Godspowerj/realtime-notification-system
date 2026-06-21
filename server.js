const { createServer } = require("http");
const { Server } = require("socket.io");
const { QueueEvents } = require('bullmq');
const { connection } = require('./queue');
const app = require('./app');
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5500"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set('io', io);

// 1. Bring in the tools to connect Socket.io to Redis
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

// 2. Create the Microphone (Publisher) so this server can shout to other servers
const pubClient = createClient({ url: "redis://127.0.0.1:6380" });

// 3. Create the Radio Receiver (Subscriber) so this server can listen to other servers
const subClient = pubClient.duplicate();

// 4. Connect BOTH the Microphone and Radio to Redis at the same time
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  // 5. Once connected, physically plug them into our Socket.io megaphone
  io.adapter(createAdapter(pubClient, subClient));
  console.log("🔗 Redis Adapter connected! (Radio Station Online)");
});
// -----------------------------------



io.on ('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const queueEvents = new QueueEvents('notifications', { connection });

queueEvents.on('completed', ({ jobId }) => {
  console.log(`Job completed: ${jobId}`);
  io.emit('jobCompleted', { jobId });
});
 
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
