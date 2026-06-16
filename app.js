const express = require('express');
const { notificationQueue } = require('./queue');
const app = express();

app.use(express.json());


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
    await notificationQueue.add('send-notification', { message });
    res.status(200).json({ status: 'published', message });
});

module.exports = app          
