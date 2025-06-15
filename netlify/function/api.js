// netlify/functions/api.js
// This is the actual Netlify Function handler that wraps your Express app.

const serverless = require('serverless-http');
const app = require('../../app'); // Adjust the path based on your project structure

// The 'handler' export is what Netlify (and AWS Lambda) looks for.
exports.handler = serverless(app);

// For local development with 'netlify dev', you might also listen on a port:
// if (process.env.NETLIFY_DEV) {
//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`Local Express server running on port ${port}`));
// 
