// netlify/functions/api.js
// This is the actual Netlify Function handler that wraps your Express app.

const serverless = require('serverless-http');
// IMPORTANT: Updated path to point to 'index.js' assuming it's in the project root.
const app = require('../../index'); 

// The 'handler' export is what Netlify (and AWS Lambda) looks for.
exports.handler = serverless(app);

// For local development with 'netlify dev', you might also listen on a port:
// if (process.env.NETLIFY_DEV) {
//   const port = process.env.PORT || 3000;
//   app.listen(port, () => console.log(`Local Express server running on port ${port}`));
// }
