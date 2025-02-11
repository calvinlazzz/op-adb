import React, { useState } from 'react';
import axios from 'axios';

const AdbCommand = () => {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        executeCommand(command);
    };

    const executeCommand = async (cmd) => {
        try {
            if (cmd === 'reboot') {
                setOutput('Device rebooted');
            }
            const response = await axios.post('http://localhost:3000/execute-adb', { command: cmd });
            setOutput(response.data.output);
        } catch (error) {
            setOutput(error.response.data.error);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter ADB command"
                />
                <button type="submit">Execute</button>
            </form>
            <div>
                <button onClick={() => executeCommand('reboot')}>Reboot</button>
                <button onClick={() => executeCommand('devices')}>Devices</button>
                <button onClick={() => executeCommand('shell ls')}>Shell List</button>
                {/* Add more buttons for other common commands as needed */}
            </div>
            <pre>{output}</pre>
        </div>
    );
};

export default AdbCommand;