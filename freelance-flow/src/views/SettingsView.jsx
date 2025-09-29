import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { CURRENCIES } from '../lib/utils';
import { invoiceTranslations } from '../lib/invoiceTranslations';
import ArchivedItemsView from './ArchivedItemsView';

import ResetData from '../components/ResetData';

const SettingsView = ({ showToast, onImport, onExport }) => {
    const { userProfile, currencySettings, profitabilitySettings, taxSettings, setUserProfile, setCurrencySettings, setProfitabilitySettings, setTaxSettings } = useStore();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('general');

    const [profile, setProfile] = useState(userProfile);
    const [settings, setSettings] = useState(currencySettings);
    const [profitability, setProfitability] = useState(profitabilitySettings);
    const [tax, setTax] = useState(taxSettings);

    useEffect(() => {
        setProfile(userProfile);
        setSettings(currencySettings);
        setProfitability(profitabilitySettings);
        setTax(taxSettings);
    }, [userProfile, currencySettings, profitabilitySettings, taxSettings]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleProfitabilityChange = (e) => {
        const { name, value } = e.target;
        setProfitability(prev => ({ ...prev, [name]: value }));
    };

    const handleTaxChange = (e) => {
        const { name, value } = e.target;
        setTax(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setUserProfile(profile);
        setCurrencySettings(settings);
        setProfitabilitySettings({ ...profitability, internalCostRate: parseFloat(profitability.internalCostRate) || 0 });
        setTaxSettings(tax);
        showToast('Settings saved successfully!');
    };
    
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
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application settings and archived data.</p>

            <div className="border-b dark:border-slate-800 mt-8 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`${
                            activeTab === 'general'
                                ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        General Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`${
                            activeTab === 'archived'
                                ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Archived Items
                    </button>
                </nav>
            </div>

            {activeTab === 'general' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Company Profile</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="companyName">Company Name</Label>
                                        <Input id="companyName" name="companyName" value={profile.companyName} onChange={handleProfileChange} />
                                    </div>
                                    <div>
                                        <Label htmlFor="companyEmail">Company Email</Label>
                                        <Input id="companyEmail" name="companyEmail" type="email" value={profile.companyEmail} onChange={handleProfileChange} />
                                    </div>
                                    <div>
                                        <Label htmlFor="companyAddress">Company Address</Label>
                                        <Textarea id="companyAddress" name="companyAddress" value={profile.companyAddress} onChange={handleProfileChange} />
                                    </div>
                                    <div>
                                        <Label>Company Logo</Label>
                                        <div className="flex items-center space-x-4">
                                            {profile.logo && <img src={profile.logo} alt="Company Logo" className="h-16 w-auto bg-slate-200 rounded" />}
                                            <Button onClick={() => document.getElementById('logo-upload').click()}>
                                                {profile.logo ? 'Change Logo' : 'Upload Logo'}
                                            </Button>
                                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Tax Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="rate">Tax Rate (%)</Label>
                                        <Input
                                            id="rate"
                                            name="rate"
                                            type="number"
                                            value={tax.rate}
                                            onChange={handleTaxChange}
                                            placeholder="e.g., 25"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="inclusive">Tax Application</Label>
                                        <Select
                                            id="inclusive"
                                            name="inclusive"
                                            value={tax.inclusive}
                                            onChange={handleTaxChange}
                                        >
                                            <option value="false">Add tax to final amount</option>
                                            <option value="true">Price includes tax</option>
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-8">
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
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Permanently delete all data. This cannot be undone.</p>
                                        <ResetData showToast={showToast} />
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Currency & Language</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="default">Default Currency</Label>
                                        <Select id="default" name="default" value={settings.default} onChange={handleSettingsChange}>
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="invoiceLanguage">Invoice Language</Label>
                                        <Select id="invoiceLanguage" name="invoiceLanguage" value={settings.invoiceLanguage} onChange={handleSettingsChange}>
                                            {Object.keys(invoiceTranslations).map(lang =>
                                                <option key={lang} value={lang}>
                                                    {lang.toUpperCase()}
                                                </option>
                                            )}
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Profitability</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="internalCostRate">Internal Hourly Cost</Label>
                                        <Input
                                            id="internalCostRate"
                                            name="internalCostRate"
                                            type="number"
                                            value={profitability.internalCostRate || ''}
                                            onChange={handleProfitabilityChange}
                                            placeholder="e.g., 50"
                                        />
                                        <p className="text-sm text-slate-500 mt-1">Set your internal cost per hour for accurate project profitability tracking.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button onClick={handleSave} size="lg">Save All Settings</Button>
                    </div>
                </>
            )}

            {activeTab === 'archived' && (
                <ArchivedItemsView showToast={showToast} />
            )}
        </div>
    );
};

export default SettingsView;