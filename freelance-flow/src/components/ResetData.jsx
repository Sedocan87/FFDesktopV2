
import React, { useState } from 'react';
import useStore from '../store';
import Button from './Button';
import Dialog from './Dialog';
import Input from './Input';
import Label from './Label';

const ResetData = ({ showToast }) => {
    const [showDialog, setShowDialog] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const resetAllData = useStore(state => state.resetAllData);

    const handleReset = () => {
        if (confirmationText === 'delete') {
            resetAllData();
            setShowDialog(false);
            showToast('All application data has been reset.', 'success');
        } else {
            showToast('Confirmation text is incorrect. Please type "delete" to confirm.', 'error');
        }
    };

    return (
        <>
            <Button 
                variant="danger" 
                onClick={() => setShowDialog(true)}
            >
                Reset All Data
            </Button>

            <Dialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                title="Reset Application Data"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        This action will permanently delete all your data, including projects, invoices, clients, and settings. 
                        This cannot be undone.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                        To prevent accidental data loss, we recommend you <span className="font-semibold">export your data</span> before proceeding.
                    </p>
                    <div>
                        <Label htmlFor="confirmation">To confirm, please type "delete" in the box below.</Label>
                        <Input
                            id="confirmation"
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="delete"
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleReset} disabled={confirmationText !== 'delete'}>
                        Reset Data
                    </Button>
                </div>
            </Dialog>
        </>
    );
};

export default ResetData;
