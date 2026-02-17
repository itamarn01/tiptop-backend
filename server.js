const express = require('express');
const cors = require('cors');
require('dotenv').config();
require("./src/DB");

const Token = require("./src/models/Token"); // Ensure this path is correct
const User = require("./src/models/User");   // Ensure this path is correct
const Client = require("./src/models/Client")
const app = express();
const path = require("path");
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// Set EJS as the template engine
app.set("view engine", "ejs");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.render("landing");
});

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy");
});

app.get("/app-ads.txt", (req, res) => {
    res.set("Content-Type", "text/plain");
    res.sendFile(path.join(__dirname, "public", "app-ads.txt"));
});

// Route to render the form dynamically
app.get("/form/:token", async (req, res) => {
    const { token } = req.params;

    try {
        // Validate the token and get the associated adminId
        const tokenEntry = await Token.findOne({ token });
        if (!tokenEntry) {
            return res.status(404).send("Invalid or expired form link.");
        }

        const adminId = tokenEntry.adminId;

        // Fetch the therapist (admin) details
        const therapist = await User.findById(adminId);
        if (!therapist) {
            return res.status(404).send("Therapist not found.");
        }

        // Pass therapist data and token to the EJS template
        res.render("form", {
            therapist: {
                logo: therapist.logo,
                name: therapist.name,
                email: therapist.email,
                phone: therapist.phone,
                specialization: therapist.specialization,
                experience: therapist.experience,
                clinicName: therapist.clinicName,
                clinicAddress: therapist.clinicAddress,
                welcomeMessage: therapist.welcomeMessage,
                thankYouMessage: therapist.thankYouMessage,

            },
            token,
        });
    } catch (error) {
        console.error("Error rendering form:", error);
        res.status(500).send("Server error.");
    }
});

app.post("/submit-form/:token", async (req, res) => {
    const { token } = req.params;
    
    // נשלוף את השדות הבודדים מה-body (כולל אלו של ההורה)
    const { 
        name, lastName, birthday, gender, idNumber, 
        description, insuranceInfo,
        parentName, parentGender, phone, email // שדות ההורה מהטופס
    } = req.body;

    try {
        const tokenEntry = await Token.findOne({ token });
        if (!tokenEntry) {
            return res.status(404).json({ message: "Invalid or expired token." });
        }

        const newClient = new Client({
            name,
            lastName,
            birthday,
            gender,
            idNumber,
            description,
            insuranceInfo,
            adminId: tokenEntry.adminId,
            // כאן אנחנו יוצרים את המערך שה-DB מצפה לו
            parents: [{
                parentName: parentName,
                gender: parentGender,
                phone: phone,
                email: email
            }]
        });

        await newClient.save();
        return res.status(201).json({ message: "Client information saved successfully.", client: newClient });
    } catch (error) {
        console.error("Error saving client:", error);
        return res.status(500).json({ message: "Error submitting form.", error });
    }
});

app.use("/api/auth", require("./src/Routes/auth"));
app.use("/api/clients", require("./src/Routes/clients"));
app.use("/api/treatments", require("./src/Routes/treatments"));
app.use("/api/payments", require("./src/Routes/payments"));
app.use("/api/home", require("./src/Routes/home"));
app.use("/api/profile", require("./src/Routes/profile"));
/* app.use("/api/profile", require("./src/Routes/profile")); */
/* app.use("/api/event", require("./src/Routes/Event"));
app.use("/api/team", require("./src/Routes/Team"));
app.use("/api/suggestions", require("./src/Routes/Suggestions"));

app.use("/api/home", require("./src/Routes/Home"));
app.use("/api/payments", require("./src/Routes/Payments"));  */



app.post("/api/checkUpdate", (req, res) => {
    // Get the current version of your app from the request body
    const currentVersion = req.body.currentVersion;

    // Compare the current version with the latest version
    const latestVersion = "1.0.0"; // Replace with the latest version of your app
    const updateStatus = getUpdateStatus(currentVersion, latestVersion);

    // Prepare the response
    const response = {
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        updateStatus: updateStatus,
    };

    // Return the response as JSON
    res.json(response);
});

// Function to determine the update status
// Function to determine the update status
function getUpdateStatus(currentVersion, latestVersion) {
    const current = currentVersion.split(".").map(Number);
    const latest = latestVersion.split(".").map(Number);

    // Major version check
    if (current[0] < latest[0]) return "mustUpdate";
    if (current[0] > latest[0]) return "noUpdate";

    // Minor version check
    if (current[1] < latest[1]) return "recommendToUpdate";
    if (current[1] > latest[1]) return "noUpdate";

    // Patch version check
    if (current[2] < latest[2]) return "updateAvailable";

    return "noUpdate"; // Versions are identical or current is newer
}
