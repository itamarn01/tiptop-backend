const express = require('express');
const cors = require('cors');
require('dotenv').config();
require("./src/DB");



const app = express();
const path = require("path");
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("hello Itamar");
});

app.use("/api/auth", require("./src/Routes/auth"));
app.use("/api/clients", require("./src/Routes/clients"));
app.use("/api/treatments", require("./src/Routes/treatments"));
app.use("/api/payments", require("./src/Routes/payments"));
/* app.use("/api/event", require("./src/Routes/Event"));
app.use("/api/team", require("./src/Routes/Team"));
app.use("/api/suggestions", require("./src/Routes/Suggestions"));

app.use("/api/home", require("./src/Routes/Home"));
app.use("/api/payments", require("./src/Routes/Payments"));  */



app.post("/checkUpdate", (req, res) => {
    // Get the current version of your app from the request body
    const currentVersion = req.body.currentVersion;

    // Compare the current version with the latest version
    const latestVersion = "1.1.0"; // Replace with the latest version of your app
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
function getUpdateStatus(currentVersion, latestVersion) {
    const currentVersionArray = currentVersion.split(".").map(Number);
    const latestVersionArray = latestVersion.split(".").map(Number);

    // Compare each segment of the version number
    for (let i = 0; i < currentVersionArray.length - 1; i++) {
        if (currentVersionArray[i] < latestVersionArray[i]) {
            return "mustUpdate"; // Major or minor version update
        }
    }
    if (currentVersionArray[2] < latestVersionArray[2]) {
        return "recommendToUpdate";
    }

    return "noUpdate"; // Versions are identical
}