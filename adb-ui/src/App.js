// filepath: /path/to/adb-ui/src/App.js
import React from 'react';
import AdbCommand from './AdbCommand';
import './App.css';

const App = () => {
    return (
        <div>
            <h1 className='appHeader'>ADB Command Executor</h1>
            <AdbCommand />
        </div>
    );
};

export default App;