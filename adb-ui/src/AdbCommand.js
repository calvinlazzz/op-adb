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
    const [isShellList, setIsShellList] = useState(false); // Tracks if the output is from a Shell List
    useEffect(() => {
        // Fetch saved commands on component mount
        fetchSavedCommands();
    }, []);

    const fetchSavedCommands = async () => {
        try {
            const response = await axios.get('http://localhost:3000/commands');
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
    
    const saveEditedCommand = async (e) => {
        e.preventDefault(); // Prevent any default form submission behavior
        try {
            const response = await axios.put(`http://localhost:3000/edit-command/${editingCommand.id}`, {
                name: newName,
                command: newCommand,
            });
            setSavedCommands(savedCommands.map(cmd => cmd.id === editingCommand.id ? response.data : cmd));
            setEditingCommand(null);
            setNewName('');
            setNewCommand('');
            setSuccess('Command edited successfully'); // Show success message
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Error editing command:', error);
            setError('Failed to edit command'); // Show error message
            setSuccess(''); // Clear any previous success message
        }
    };
    const handleDeleteCommand = async (id) => {
        try {
            await axios.delete(`http://localhost:3000/delete-command/${id}`);
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
    const executeCommand = async (cmd, path = '') => {
        try {
            const fullCommand = path ? `${cmd} ${path}` : cmd; // Append the path if provided
            setIsShellList(cmd.startsWith('shell ls -l')); // Check if it's a Shell List command
            const response = await axios.post('http://localhost:3000/execute-adb', { command: fullCommand });
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
            const response = await axios.post('http://localhost:3000/save-command', { command });
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
            const response = await axios.post('http://localhost:3000/execute', { command: cmd });
            setOutput(response.data.output);
            setError(''); // Clear any previous errors
            setSuccess('Command executed successfully'); // Set success message
        } catch (error) {
            setError(error.response ? error.response.data.error : 'An unknown error occurred');
            setSuccess(''); // Clear any previous success message
        }
    };

    //Quick buttons
    const handleDirectoryClick = (dir, targetPath) => {
        const newPath = targetPath || (currentPath ? `${currentPath}/${dir}` : dir);
        setCurrentPath(newPath);
        console.log('New path:', newPath);
        executeCommand('shell ls -l', newPath); // Pass the path to the command
    };

    const handleBackClick = () => {
        const newPath = currentPath.split('/').slice(0, -1).join('/');
        setCurrentPath(newPath);
        executeCommand('shell ls -l', newPath); // Pass the path to the command
    };

    const handleShellListClick = () => {
        setCurrentPath(''); // Clear the current path
        executeCommand('shell ls -l'); // No path needed
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
    
        if (isShellList) {
            // Render Shell List output
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
                            <li
                                key={index}
                                className={isDirectory || isLink ? 'directory' : 'file'}
                                onClick={isDirectory || isLink ? () => handleDirectoryClick(displayName, targetPath) : null}
                                style={{ cursor: isDirectory || isLink ? 'pointer' : 'default' }}
                            >
                                {displayName}
                            </li>
                        );
                    })}
                </ul>
            );
        } else {
            // Render raw output for other commands
            return (
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {output}
                </pre>
            );
        }
    };

    return (
        <div className="container mt-4">
            <div className="border p-4 rounded shadow">
                <div className="text-center mb-4">
                    <h2>ADB Command Executor</h2>
                </div>
                <div className="mb-4">
                    <form onSubmit={handleSubmit} className="d-flex flex-column align-items-center">
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                placeholder="Enter ADB command"
                            />
                            <button type="submit" className="btn btn-primary">ADB Execute</button>
                        </div>
                        <div className="d-flex gap-2">
                            <button onClick={handleExecute} className="btn btn-secondary">Normal Execute</button>
                            <button onClick={(e) => saveCommand(e)} className="btn btn-success">Save Command</button>
                        </div>
                    </form>
                </div>
                <div className="mb-4">
                    <h4>Quick Actions</h4>
                    <div className="d-flex flex-wrap gap-2">
                        <button onClick={() => executeCommand('reboot')} className="btn btn-warning">Reboot</button>
                        <button onClick={handleFactoryRebootClick} className="btn btn-danger">Factory Reboot</button>
                        <button onClick={() => executeCommand('shell setprop "persist.sys.ota.disable" 1')} className="btn btn-info">Turn off OTA updater</button>
                        <button onClick={() => executeCommand('devices')} className="btn btn-dark">Devices</button>
                        <button onClick={handleShellListClick} className="btn btn-light">Shell List</button>
                        <button onClick={handleBackClick} className="btn btn-outline-secondary">Back</button>
                    </div>
                </div>
                <div className="mb-4">
                    <h4>Saved Commands</h4>
                    <div className="list-group">
                        {savedCommands.map((cmd) => (
                            <div key={cmd.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <button onClick={() => executeCommand(cmd.command)} className="btn btn-link">
                                    {cmd.name || cmd.command}
                                </button>
                                <div>
                                    <button onClick={() => handleEditCommand(cmd)} className="btn btn-sm btn-outline-primary me-2">Edit</button>
                                    <button onClick={() => handleDeleteCommand(cmd.id)} className="btn btn-sm btn-outline-danger">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {editingCommand && (
                        <div className="mt-3">
                            <h5>Edit Command</h5>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    className="form-control mb-2"
                                    value={newName || ''}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter button name"
                                />
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newCommand || ''}
                                    onChange={(e) => setNewCommand(e.target.value)}
                                    placeholder="Enter command"
                                />
                            </div>
                            <div className="d-flex gap-2">
                                <button onClick={(e) => saveEditedCommand(e)} className="btn btn-success">Save</button>
                                <button onClick={() => setEditingCommand(null)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="output">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                    <pre>{renderOutput()}</pre>
                </div>
            </div>
        </div>
    );
};

export default AdbCommand;