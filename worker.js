const { Worker } = require('bullmq');
const { connection } = require('./queue');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient()                   


console.log('Chef is looking at the Clipboard and waiting for tickets...');


const worker = new Worker('notifications', async (job) => {
    
    console.log(`[Worker] Cooking ticket: ${job.name}`);
    
    const savedNotification = await prisma.notification.create({
        data: {
            message: job.data.message,
        }
    });
    
    console.log(`[Worker] Finished cooking: "${savedNotification.message}"`);
    
}, { connection }); 

worker.on('failed', (job, err) => {
    console.log(`[ALARM] Job ${job.id} completely failed after all retries: ${err.message}`);
});             
