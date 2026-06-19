const express = require('express');
const { notificationQueue } = require('./queue');
const app = express();
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient()

app.use(express.json());

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5500'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.static('public'));


app.get('/health', (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Notification Server is running!"
    })
})



app.post('/notify', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const payload = {
        message,
        timestamp: new Date().toISOString()
    };

    const io = req.app.get('io');
    if (io) {
        io.emit('chatMessage', payload);
    }

    try {
        await notificationQueue.add('send-notification', payload);
        return res.status(200).json({ status: 'published', queued: true, message: payload });
    } catch (queueError) {
        console.error('Failed to queue notification:', queueError.message || queueError);

        try {
            const savedNotification = await prisma.notification.create({
                data: { message }
            });
            return res.status(200).json({
                status: 'published',
                queued: false,
                fallback: true,
                notification: savedNotification
            });
        } catch (dbError) {
            console.error('Failed to save notification as fallback:', dbError.message || dbError);
            return res.status(500).json({
                status: 'error',
                error: 'Unable to save notification. Check Redis or database connection.'
            });
        }
    }
});

module.exports = app          
