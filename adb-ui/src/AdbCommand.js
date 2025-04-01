import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css'; // Import the CSS file

const AdbCommand = () => {
    const [command, setCommand] = useState('');
    const [output, setOutput] = useState('');
    const [currentPath, setCurrentPath] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('');
    const [savedCommands, setSavedCommands] = useState([]); // State to store saved commands
    const [editingCommand, setEditingCommand] = useState(null); // Command being edited
    const [newName, setNewName] = useState(''); // New name for the command
    const [newCommand, setNewCommand] = useState(''); // New command text

    useEffect(() => {
        // Fetch saved commands on component mount
        fetchSavedCommands();
    }, []);

    const fetchSavedCommands = async () => {
        try {
            const response = await axios.get('http://10.0.1.29:3000/commands');
            setSavedCommands(response.data);
        } catch (error) {
            console.error('Error fetching saved commands:', error);
        }
    };

    const handleEditCommand = (cmd) => {
        setEditingCommand(cmd);
        setNewName(cmd.name);
        setNewCommand(cmd.command);
    };
    
    const saveEditedCommand = async () => {
        try {
            const response = await axios.put(`http://10.0.1.29:3000/edit-command/${editingCommand.id}`, {
                name: newName,
                command: newCommand,
            });
            setSavedCommands(savedCommands.map(cmd => cmd.id === editingCommand.id ? response.data : cmd));
            setEditingCommand(null);
            setNewName('');
            setNewCommand('');
        } catch (error) {
            console.error('Error editing command:', error);
            setError('Failed to edit command');
        }
    };
    const handleDeleteCommand = async (id) => {
        try {
            await axios.delete(`http://10.0.1.29:3000/delete-command/${id}`);
            setSavedCommands(savedCommands.filter(cmd => cmd.id !== id));
        } catch (error) {
            console.error('Error deleting command:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        executeCommand(command);
    };

    const handleExecute = async (e) => {
        e.preventDefault();
        executeCommand1(command);
    };
    const executeCommand = async (cmd) => {
        try {
            const response = await axios.post('http://10.0.1.29:3000/execute-adb', { command: cmd });
            setOutput(response.data.output);
            setError('');
            setSuccess('Command executed successfully');
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
            setSuccess('');
        }
    };

    const saveCommand = async (e) => {
        e.preventDefault(); // Prevent form submission
        if (!command.trim()) return;
        try {
            const response = await axios.post('http://10.0.1.29:3000/save-command', { command });
            setSavedCommands([response.data, ...savedCommands]); // Add the new command to the list
            setCommand(''); // Clear the input field
            setSuccess('Command saved successfully'); // Show success message
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Error saving command:', error);
            setError('Failed to save command'); // Show error message
            setSuccess(''); // Clear any previous success message
        }
    };
    const executeCommand1 = async (cmd) => {
        try {
            const response = await axios.post('http://10.0.1.29:3000/execute', { command: cmd });
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

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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
        <div className="container">
            <div className="bordered-container">
                <div className="appHeader">
                </div>
                <div className="inputBox">
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Enter ADB command"
                        />
                        <button type="submit" className="button">ADB Execute</button>
                        <button onClick={handleExecute} className="button">Normal Execute</button>
                        <button onClick={(e) => saveCommand(e)} className="button">Save Command</button>
                    </form>
                </div>
                <div className="buttons">
                    <button onClick={() => executeCommand('reboot')} className="button">Reboot</button>
                    <button onClick={handleFactoryRebootClick} className="button">Factory Reboot</button>
                    <button onClick={() => executeCommand('shell setprop "persist.sys.ota.disable" 1')} className="button">Turn off OTA updater</button>
                    <button onClick={() => executeCommand('devices')} className="button">Devices</button>
                    <button onClick={handleShellListClick} className="button">Shell List</button>
                    <button onClick={handleBackClick} className="button">Back</button>
                    {/* <input
                        type="file"
                        webkitdirectory="true"
                        directory="true"
                        onChange={handleFolderSelect}
                        id="folderInput"
                    />
                    <label htmlFor="folderInput">
                        <button className="button">Select Folder</button>
                    </label>
                    <button onClick={handlePullLogsClick} className="button">Pull Logs</button> */}
                    {/* Add more buttons for other common commands as needed */}
                </div>
                <div className="savedCommands">
                <h3>Saved Commands</h3>
                    {savedCommands.map((cmd) => (
                        <div key={cmd.id} className="savedCommand">
                            <button onClick={() => executeCommand(cmd.command)} className="button">
                                {cmd.name || cmd.command}
                            </button>
                            <button onClick={() => handleEditCommand(cmd)} className="button editButton">Edit</button>
                            <button onClick={() => handleDeleteCommand(cmd.id)} className="button deleteButton">Delete</button>
                        </div>
                    ))}
                    {editingCommand && (
                        <div className="editCommand">
                            <h4>Edit Command</h4>
                            <input
                                type="text"
                                value={newName || ''}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter button name"
                            />
                            <input
                                type="text"
                                value={newCommand || ''}
                                onChange={(e) => setNewCommand(e.target.value)}
                                placeholder="Enter command"
                            />
                            <button onClick={saveEditedCommand} className="button saveButton">Save</button>
                            <button onClick={() => setEditingCommand(null)} className="button cancelButton">Cancel</button>
                        </div>
                    )}
                </div>
                <div className="output">
                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}
                    <pre>{renderOutput()}</pre>
                </div>
            </div>
        </div>
    );
};

export default AdbCommand;