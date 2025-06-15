// index.js
const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const serverless = require('serverless-http'); // Although this is used in api.js, it's good to keep track of its presence.

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Configure the views directory.
// IMPORTANT CHANGE: Adjust the path to correctly find 'views' relative to the project root.
// In a Netlify Function, __dirname refers to the function's directory,
// but the 'views' folder is at the project root.
// We need to go up one level from the function's location (/var/task/netlify/functions)
// to reach the project root (/var/task/), then find 'views'.
// So, it becomes `path.join(__dirname, '..', 'views')`.
app.set('views', path.join(__dirname, '..', 'views')); // Corrected path resolution

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing x-www-form-urlencoded

// --- Firebase Admin SDK Initialization ---
console.log("Attempting Firebase initialization...");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Attempt to handle private key newlines
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Check if environment variables for production are set
if (projectId && clientEmail && privateKey) {
    console.log("Found Firebase environment variables. Initializing for PRODUCTION context.");
    console.log(`Firebase Project ID: ${projectId ? 'Set' : 'NOT SET'}`);
    console.log(`Firebase Client Email: ${clientEmail ? 'Set' : 'NOT SET'}`);
    console.log(`Firebase Private Key length: ${privateKey ? privateKey.length : 'NOT SET'}`);
    if (privateKey && privateKey.length > 50) { // Basic check for plausible length
        console.log("Firebase Private Key appears to have content.");
        console.log("First 50 chars of Private Key:", privateKey.substring(0, 50));
    } else {
        console.warn("Firebase Private Key seems short or missing.");
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey
            })
        });
        console.log("Firebase initialized successfully for PRODUCTION context.");
    } catch (error) {
        console.error("Firebase initialization FAILED in PRODUCTION block:", error.message);
        throw new Error(`Firebase initialization failed with environment variables: ${error.message}`);
    }
} else {
    // If environment variables are not set, assume local development
    console.log("Firebase environment variables NOT found. Attempting local DEVELOPMENT initialization.");
    try {
        // Ensure serviceAccountKey.json exists locally and is in .gitignore
        const serviceAccount = require("./serviceAccountKey.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase initialized successfully using local serviceAccountKey.json.");
    } catch (error) {
        console.warn("serviceAccountKey.json not found or invalid for local dev. Ensure it's present for local dev.");
        console.error("Firebase initialization FAILED in DEVELOPMENT block:", error.message);
        throw new Error(`Firebase local initialization failed: ${error.message}`);
    }
}

// This line will only be reached if initializeApp() was successful.
const db = admin.firestore();
console.log("Firestore instance obtained.");
// --- End Firebase Admin SDK Initialization ---


// --- Express Routes ---

// Routes that render EJS templates
app.get('/', (req, res) => {
    res.render("home");
});

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/newContact', (req, res) => {
    res.render("newContact");
});

app.get('/logoutHome', (req, res) => {
    res.render("logoutHome");
});

// Route to fetch and display contacts
app.get('/contacts', (req, res) => {
    const contactsArray = [];
    db.collection("contactsData").get()
        .then((docs) => {
            docs.forEach((doc) => {
                contactsArray.push(doc.data());
            });
            res.render("contacts", { a: contactsArray });
        })
        .catch(error => {
            console.error("Error fetching contacts:", error);
            res.status(500).send("Error fetching contacts.");
        });
});

// Route for signup form submission
app.get('/signupSubmit', function (req, res) {
    const name = req.query.name;
    const email = req.query.email;
    const password = req.query.password;

    db.collection("contactsSignUp").add({
        name: name,
        email: email,
        password: password,
    })
        .then(() => {
            res.render("login");
        })
        .catch(error => {
            console.error("Error signing up:", error);
            res.status(500).send("Error signing up.");
        });
});

// Route for login form submission
app.get('/loginSubmit', function (req, res) {
    const email = req.query.em;
    const password = req.query.pwd;

    db.collection("contactsSignUp")
        .where("email", "==", email)
        .where("password", "==", password)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.render('loginHome.ejs');
            } else {
                res.send("Login failed: Invalid email or password.");
            }
        })
        .catch(error => {
            console.error("Error during login:", error);
            res.status(500).send("Error during login.");
        });
});

// Route for contact form submission
app.get('/contactSubmit', function (req, res) {
    const name = req.query.name;
    const email = req.query.email;
    const phone = req.query.phone;

    db.collection("contactsData").add({
        name: name,
        email: email,
        phone: phone,
    })
        .then(() => {
            res.send("Contact added successfully!");
        })
        .catch(error => {
            console.error("Error adding contact:", error);
            res.status(500).send("Error adding contact.");
        });
});

// --- End Express Routes ---

// Export the Express app for serverless-http wrapper
module.exports = app;
