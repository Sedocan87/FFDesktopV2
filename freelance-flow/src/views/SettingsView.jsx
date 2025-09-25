import React, { useRef } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';

const SettingsView = ({ showToast, onImport, onExport }) => {
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImport(file);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application settings.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Data Management</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Export your data to a file. This is useful for backups.</p>
                            <Button onClick={onExport}>Export Data</Button>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Import data from a file. This will overwrite your current data.</p>
                            <Button onClick={handleImportClick}>Import Data</Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".db"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;