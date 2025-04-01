const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const cors = require('cors'); // Import the cors package
const sqlite3 = require('sqlite3').verbose(); // Import SQLite

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use the cors middleware

const db = new sqlite3.Database('./adb_commands.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
             CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, -- Add a name column for the button name
                command TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});
// Endpoint to save a command to the database
app.post('/save-command', (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }
    db.run('INSERT INTO commands (command) VALUES (?)', [command], function (err) {
        if (err) {
            console.error('Error saving command:', err.message);
            return res.status(500).json({ error: 'Failed to save command' });
        }
        res.json({ id: this.lastID, command });
    });
});

// Endpoint to retrieve all saved commands
app.get('/commands', (req, res) => {
    db.all('SELECT * FROM commands ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Error retrieving commands:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve commands' });
        }
        res.json(rows);
    });
});

app.put('/edit-command/:id', (req, res) => {
    const { id } = req.params;
    const { name, command } = req.body;

    console.log('Request body:', req.body); // Log the request body for debugging

    // Validate input
    if (!name || !command) {
        return res.status(400).json({ error: 'Name and command are required' });
    }

    db.run(
        'UPDATE commands SET name = ?, command = ? WHERE id = ?',
        [name, command, id],
        function (err) {
            if (err) {
                console.error('Error updating command:', err.message);
                return res.status(500).json({ error: 'Failed to update command' });
            }
            res.json({ id, name, command });
        }
    );
});
app.delete('/delete-command/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM commands WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Error deleting command:', err.message);
            return res.status(500).json({ error: 'Failed to delete command' });
        }
        res.json({ id });
    });
});
// Existing ADB execution endpoints
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});