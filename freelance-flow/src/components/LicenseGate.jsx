import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import TrialExpiredView from '../views/TrialExpiredView';

const LicenseGate = ({ children }) => {
    const [isLicensed, setIsLicensed] = useState(false);
    const [isLoadingLicense, setIsLoadingLicense] = useState(true);
    const [isTrialExpired, setIsTrialExpired] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);

    useEffect(() => {
        const checkLicenseAndTrial = async () => {
            const savedKey = localStorage.getItem('license_key');
            if (savedKey) {
                setIsLicensed(true);
                setIsLoadingLicense(false);
                return;
            }

            const trialStartDate = await invoke('get_trial_start_date');
            if (!trialStartDate) {
                const today = new Date().toISOString().slice(0, 10);
                await invoke('set_trial_start_date', { startDate: today });
            }

            const daysLeftInTrial = await invoke('check_trial_status');
            setDaysLeft(daysLeftInTrial);

            if (daysLeftInTrial <= 0) {
                setIsTrialExpired(true);
            }

            setIsLoadingLicense(false);
        };

        checkLicenseAndTrial();
    }, []);

    if (isLoadingLicense) {
        return <div>Loading...</div>; // Or a splash screen
    }

    if (!isLicensed && isTrialExpired) {
        return <TrialExpiredView onActivationSuccess={() => setIsLicensed(true)} />;
    }

    // Pass license info down to children
    return React.cloneElement(children, { isLicensed, isTrialExpired, daysLeft });
};

export default LicenseGate;