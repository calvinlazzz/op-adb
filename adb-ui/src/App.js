// filepath: /path/to/adb-ui/src/App.js
import React from 'react';
import AdbCommand from './AdbCommand';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

const App = () => {
    return (
        <div>
            <ErrorBoundary>
            <AdbCommand />
            </ErrorBoundary>

        </div>
    );
};

export default App;