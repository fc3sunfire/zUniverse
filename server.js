// Hackthon 2023 
// Artifical Technicians
// GenInsight

// Web Server
const express = require('express');
// Axios HTTP Client (REST APIs)
const axios = require('axios');
const https = require('https');

// Create a web server instance
const app = express();

// Global Variables
let zosmfURL = "https://mvsde32.lvn.broadcom.net:1443/zosmf/";
let fileContentsPath = "restfiles/fs/"; // USS Files (/u/users/admin/home.html)
let dataSetContentsPath = "restfiles/ds/"; // Datasets or members (SYSSHR.HACKATHN.JCL(main))
let jobContentsPath = "restjobs/jobs"; // Job submittion

// zOSMF Info
let webISPFPath = "/webispf/"; //index.jsp"

// TSO Login
let username = "JF893404";
let password = "MS0$EJ0$";
// Base64 Encoded
let authString = '${username}:${password}';
let encodedAuthString = Buffer.from(authString).toString('base64');

// API Fetch
const fetchData = async () => {
    try {
        const response = await axios.get(zosmfURL + webISPFPath, {
            // Bypass certificate validation (dev only)
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            headers: {
                'Authorization': 'Basic ${encodedAuthString}'
            }
        });
        console.log(response.data); // Print the results to the console log
    } catch (error) {
        console.error('Error fetching data:', error);
    } // end try
}; // end const fetchData

const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    fetchData();
});

