const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const cors = require('cors'); // Import the cors package

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use the cors middleware

app.post('/execute-adb', (req, res) => {
    const { command, path } = req.body;
    const adbCommand = path ? `adb shell ls -l ${path}` : `adb ${command}`;
    exec(adbCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${adbCommand}`);
            console.error(`stderr: ${stderr}`);
            console.error(`stdout: ${stdout}`);
            return res.status(500).json({ error: `Failed to execute command: ${stderr.trim()}` });
        }
        res.json({ output: stdout });
    });
});
app.post('/execute', (req, res) => {
    const { command } = req.body;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${command}`);
            console.error(`stderr: ${stderr}`);
            console.error(`stdout: ${stdout}`);
            return res.status(500).json({ error: `Failed to execute command: ${stderr.trim()}` });
        }
        res.json({ output: stdout });
    });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});