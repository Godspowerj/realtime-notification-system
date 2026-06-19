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
