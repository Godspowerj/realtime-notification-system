const { Queue } = require('bullmq');

const connection = {
    host:'127.0.0.1',
    port: 6380
}

const notificationQueue = new Queue('notifications' ,  {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        }
    }   
});

module.exports = { notificationQueue , connection}