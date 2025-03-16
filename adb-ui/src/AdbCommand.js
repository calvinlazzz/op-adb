import React, { useState } from 'react';
import axios from 'axios';
import './index.css'; // Import the CSS file

const AdbCommand = () => {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        executeCommand(command);
    };

    const handleExecute = async (e) => {
        e.preventDefault();
        executeCommand1(command);
    };

    const executeCommand = async (cmd, path = '') => {
        try {
            const response = await axios.post('http://localhost:3000/execute-adb', { command: cmd, path });
            setOutput(response.data.output);
            setError(''); // Clear any previous errors
            setSuccess('Command executed successfully'); // Set success message
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
            setSuccess(''); // Clear any previous success message
        }
    };

    const executeCommand1 = async (cmd) => {
        try {
            const response = await axios.post('http://localhost:3000/execute', { command: cmd });
            setOutput(response.data.output);
            setError(''); // Clear any previous errors
            setSuccess('Command executed successfully'); // Set success message
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
            setSuccess(''); // Clear any previous success message
        }
    };

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

    const handleFactoryRebootClick = () => {
        const confirmed = window.confirm('Are you sure you want to Factory reset the device?');
        if (confirmed) {
            executeCommand('shell su 1000 content call --uri content://com.clover.service.provider --method masterClear');
        }
    };

    const handlePullLogsClick = () => {
        const logFileName = window.prompt('Enter the log file name:', 'adblogs');
        if (logFileName && selectedFolder) {
            const localPath = `${selectedFolder}/${logFileName}`;
            // Ensure the directory exists
            const fs = window.require('fs');
            const path = window.require('path');
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            executeCommand(`pull /data/log ${localPath}`);
        }
    };

    const handleFolderSelect = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const folderPath = files[0].path;
            setSelectedFolder(folderPath);
            console.log('Selected folder:', folderPath);
        } else {
            console.log('No folder selected');
        }
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
                <button onClick={handleFactoryRebootClick}>Factory Reboot</button>
                <button onClick={() => executeCommand('shell setprop "persist.sys.ota.disable" 1')}>Turn off OTA updater</button>
                <button onClick={() => executeCommand('devices')}>Devices</button>
                <button onClick={handleShellListClick}>Shell List</button>
                <button onClick={handleBackClick}>Back</button>
                {/* <input
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    onChange={handleFolderSelect}
                    id="folderInput"
                />
                <label htmlFor="folderInput">
                    <button>Select Folder</button>
                </label>
                <button onClick={handlePullLogsClick}>Pull Logs</button> */}
                {/* Add more buttons for other common commands as needed */}
            </div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            <pre>{renderOutput()}</pre>
        </div>
    );
};

export default AdbCommand;