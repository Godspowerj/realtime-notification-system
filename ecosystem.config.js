module.exports = {
  apps: [
    {
      name: "api-server",
      script: "./server.js",
      instances: 4, // We are cloning the server 4 times!
      exec_mode: "cluster", // This tells PM2 to use the Node.js Cluster module
      env: {
        NODE_ENV: "development",
        PORT: 3000 // PM2 magically shares this port across all 4 servers!
      }
    },
    {
      name: "background-worker",
      script: "./worker.js",
      instances: 1, // We only need 1 worker to safely process the queue without overwhelming the database
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};
