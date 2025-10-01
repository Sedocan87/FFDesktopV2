import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const ActivationView = ({ onActivationSuccess }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleActivate = async () => {
        if (!licenseKey) {
            setError('Please enter a license key.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const isValid = await invoke('activate_license', { licenseKey });
            if (isValid) {
                // Store the key locally so we don't ask for it again
                localStorage.setItem('license_key', licenseKey);
                onActivationSuccess();
            } else {
                setError('Invalid or inactive license key.');
            }
        } catch (err) {
            setError('An error occurred during activation.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Style this view to look good
        <div>
            <h2>Activate Zentie</h2>
            <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Enter your license key"
            />
            <button onClick={handleActivate} disabled={isLoading}>
                {isLoading ? 'Activating...' : 'Activate'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default ActivationView;