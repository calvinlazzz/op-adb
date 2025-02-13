import React, { useState } from 'react';
import axios from 'axios';
import './index.css'; // Import the CSS file

const AdbCommand = () => {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        executeCommand(command);
    };
    const handleExecute = async (e) => {
        e.preventDefault();
        executeCommand1(command);
    }

    const executeCommand = async (cmd, path = '') => {
        try {
            const response = await axios.post('http://localhost:3000/execute-adb', { command: cmd, path });
            setOutput(response.data.output);
            setError(''); // Clear any previous errors
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
        }
    };
    const executeCommand1 = async (cmd) => {
        try {
            const response = await axios.post('http://localhost:3000/execute', { command: cmd });
            setOutput(response.data.output);
            setError(''); // Clear any previous errors
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
        }
    }

    const handleDirectoryClick = (dir, targetPath) => {
        const newPath = targetPath || (currentPath ? `${currentPath}/${dir}` : dir);
        setCurrentPath(newPath);
        console.log('New path:', newPath);
        executeCommand('shell ls -l', newPath);
    };

    const handleBackClick = () => {
        const newPath = currentPath.split('/').slice(0, -1).join('/');
        setCurrentPath(newPath);
        executeCommand('shell ls -l', newPath);
    };

    const handleShellListClick = () => {
        setCurrentPath(''); // Clear the current path
        executeCommand('shell ls -l');
    };

    const renderOutput = () => {
        if (!output) return null;
        const items = output.split('\n').filter(item => item);
        return (
            <ul>
                {items.map((item, index) => {
                    const isDirectory = item.startsWith('d');
                    const isLink = item.startsWith('l');
                    const parts = item.split(' ');
                    const itemName = parts.pop();
                    const targetPath = isLink && item.split('->')[1] ? item.split('->')[1].trim() : null;
                    const displayName = isLink ? item.split('->')[0].trim().split(' ').pop() : itemName;
                    return (
                        <li key={index} className={isDirectory || isLink ? 'directory' : 'file'} onClick={isDirectory || isLink ? () => handleDirectoryClick(displayName, targetPath) : null} style={{ cursor: isDirectory || isLink ? 'pointer' : 'default' }}>
                            {displayName}
                        </li>
                    );
                })}
            </ul>
        );
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
                <button type="submit">ADB Execute</button>
                <button onClick={handleExecute}>Normal Execute</button>

            </form>

            <div>
                <button onClick={() => executeCommand('reboot')}>Reboot</button>
                <button onClick={() => executeCommand('shell su 1000 content call --uri content://com.clover.service.provider --method masterClear')}>Factory Reboot</button>
                <button onClick={() => executeCommand('shell setprop "persist.sys.ota.disable" 1')}>Turn off OTA updater</button>
                <button onClick={() => executeCommand('devices')}>Devices</button>
                <button onClick={handleShellListClick}>Shell List</button>
                <button onClick={handleBackClick}>Back</button>
                {/* Add more buttons for other common commands as needed */}
            </div>
            {error && <div className="error">{error}</div>}
            <pre>{renderOutput()}</pre>
        </div>
    );
};

export default AdbCommand;