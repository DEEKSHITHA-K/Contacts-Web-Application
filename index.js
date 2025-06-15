// app.js
const express = require('express');
const path = require('path'); // Required for path resolution
const admin = require('firebase-admin'); // For Firebase Admin SDK
const serverless = require('serverless-http'); // For wrapping the Express app

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Configure the views directory. This assumes your 'views' folder is at the project root.
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON and URL-encoded data
// Your current code uses req.query for form submissions.
// For POST requests and more secure form handling, you would typically use:
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing x-www-form-urlencoded

// --- Firebase Admin SDK Initialization ---
// IMPORTANT: NEVER hardcode your service account key or include the JSON file
// in your repository for production environments.
// Use environment variables on Netlify.
if (process.env.NODE_ENV === 'production') {
    // For production on Netlify, credentials will come from environment variables.
    // The private_key needs special handling for newline characters.
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace escaped newlines with actual newlines
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
} else {
    // For local development, you can still use your serviceAccountKey.json file.
    // Ensure this file is NOT committed to your Git repository (add it to .gitignore).
    try {
        const serviceAccount = require("./serviceAccountKey.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase initialized using local serviceAccountKey.json");
    } catch (error) {
        console.warn("serviceAccountKey.json not found. Ensure it's present for local dev or set up environment variables.");
        console.error("Firebase initialization failed:", error.message);
    }
}

const db = admin.firestore();
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
            // Render the 'contacts' EJS template with the fetched data
            res.render("contacts", { a: contactsArray });
        })
        .catch(error => {
            console.error("Error fetching contacts:", error);
            res.status(500).send("Error fetching contacts.");
        });
});

// Route for signup form submission
// Note: Using GET for sensitive data (password) is not recommended.
// Consider converting this to a POST request and using req.body.
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
            // Redirect to login page after successful signup
            res.render("login");
        })
        .catch(error => {
            console.error("Error signing up:", error);
            res.status(500).send("Error signing up.");
        });
});

// Route for login form submission
// Note: Using GET for sensitive data (password) is not recommended.
// Consider converting this to a POST request and using req.body.
app.get('/loginSubmit', function (req, res) {
    const email = req.query.em;
    const password = req.query.pwd;

    db.collection("contactsSignUp")
        .where("email", "==", email)
        .where("password", "==", password)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                // If login successful, render loginHome.ejs
                res.render('loginHome.ejs');
            } else {
                // If login failed, send a message
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

// Wrap the Express app with serverless-http for Netlify Functions
// This exports a handler function that Netlify will execute.
module.exports.handler = serverless(app);
