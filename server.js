// filepath: /path/to/server.js
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const cors = require('cors'); // Import the cors package

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use the cors middleware

app.post('/execute-adb', (req, res) => {
    const { command } = req.body;
    exec(`adb ${command}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr });
        }
        res.json({ output: stdout });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
 });