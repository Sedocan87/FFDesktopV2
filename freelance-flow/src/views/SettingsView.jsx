import React, { useState, useRef } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { CURRENCIES } from '../lib/utils';

const SettingsView = ({ showToast, onImport, onExport }) => {
    const {
        userProfile, updateUserProfile, taxSettings, updateTaxSettings,
        currencySettings, updateCurrencySettings
    } = useStore();
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [companyForm, setCompanyForm] = useState(userProfile);
    const [currentTaxRate, setCurrentTaxRate] = useState(taxSettings.rate);
    const [currentInternalCostRate, setCurrentInternalCostRate] = useState(taxSettings.internal_cost_rate);
    const [currentDefaultCurrency, setCurrentDefaultCurrency] = useState(currencySettings.default);
    const [currentInvoiceLanguage, setCurrentInvoiceLanguage] = useState(currencySettings.invoice_language || 'en');
    const inputFileRef = useRef(null);

    const onImportClick = () => {
        inputFileRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (window.confirm("Are you sure you want to import this data? This will overwrite your current data.")) {
                    onImport(data);
                }
            } catch (error) {
                showToast("Error importing file. Please check the file format.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    };

    const handleCompanyInfoChange = (e) => {
        const { id, value } = e.target;
        setCompanyForm(prev => ({ ...prev, [id]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyForm(prev => ({...prev, logo: reader.result}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCompanyInfo = async (e) => {
        e.preventDefault();
        await updateUserProfile(companyForm);
        setIsEditingCompany(false);
        showToast("Company information updated.");
    };

    const handleSaveFinancialSettings = async (e) => {
        e.preventDefault();
        const rate = parseFloat(currentTaxRate);
        const internalRate = parseFloat(currentInternalCostRate);
        if (!isNaN(rate) && rate >= 0 && rate <= 100 && !isNaN(internalRate) && internalRate >= 0) {
            await updateTaxSettings({ rate, internal_cost_rate: internalRate });
            showToast("Financial settings saved.");
        } else {
           showToast("Please enter valid numbers for rates.");
        }
    };

    const handleSaveCurrencySettings = async (e) => {
        e.preventDefault();
        await updateCurrencySettings({
            default: currentDefaultCurrency,
            invoice_language: currentInvoiceLanguage
        });
        showToast("Currency settings saved.");
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your application settings and data.</p>

            <div className="mt-8 space-y-8">
                <Card>
                    <form onSubmit={handleSaveCompanyInfo}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Company Information</h3>
                            {!isEditingCompany && (
                                <Button type="button" variant="secondary" onClick={() => setIsEditingCompany(true)}>Edit</Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input id="companyName" type="text" value={companyForm.companyName} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                            <div>
                                <Label htmlFor="companyEmail">Company Email</Label>
                                <Input id="companyEmail" type="email" value={companyForm.companyEmail} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                             <div>
                                <Label htmlFor="companyAddress">Company Address</Label>
                                <Textarea id="companyAddress" value={companyForm.companyAddress} onChange={handleCompanyInfoChange} disabled={!isEditingCompany} />
                            </div>
                             <div>
                                <Label htmlFor="logo">Company Logo</Label>
                                <div className="flex items-center gap-4">
                                    {companyForm.logo && (
                                        <img src={companyForm.logo} alt="Logo Preview" className="h-16 w-16 object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1" />
                                    )}
                                    <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} disabled={!isEditingCompany} className="flex-1" />
                                </div>
                            </div>
                             {isEditingCompany && (
                                <div className="flex justify-end gap-4 pt-4">
                                    <Button type="button" variant="secondary" onClick={() => { setIsEditingCompany(false); setCompanyForm(userProfile); }}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            )}
                        </div>
                    </form>
                </Card>

                 <Card>
                    <form onSubmit={handleSaveCurrencySettings}>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Financial & Invoice Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="defaultCurrency">Default Currency</Label>
                                <Select id="defaultCurrency" value={currentDefaultCurrency} onChange={e => setCurrentDefaultCurrency(e.target.value)}>
                                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </Select>
                            </div>

                            {/* NEW INVOICE LANGUAGE SELECTOR */}
                            <div>
                                <Label htmlFor="invoiceLanguage">Invoice Output Language</Label>
                                <Select id="invoiceLanguage" value={currentInvoiceLanguage} onChange={e => setCurrentInvoiceLanguage(e.target.value)}>
                                    <option value="en">English</option>
                                    <option value="de">German</option>
                                </Select>
                            </div>

                             <div className="text-right">
                                <Button type="submit">Save Settings</Button>
                            </div>
                        </div>
                    </form>
                    <form onSubmit={handleSaveFinancialSettings} className="mt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="taxRate">Estimated Tax Rate (%)</Label>
                                    <Input id="taxRate" type="number" value={currentTaxRate} onChange={e => setCurrentTaxRate(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="internalCostRate">Internal Cost Rate (in default currency)/hr</Label>
                                    <Input id="internalCostRate" type="number" value={currentInternalCostRate} onChange={e => setCurrentInternalCostRate(e.target.value)} />
                                </div>
                            </div>
                            <div className="text-right">
                                <Button type="submit">Save Financials</Button>
                            </div>
                        </div>
                    </form>
                </Card>

                 <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Data Management</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input type="file" accept=".json" ref={inputFileRef} style={{ display: 'none' }} onChange={handleFileChange} />
                       <Button onClick={onExport} className="flex-1">Export Data</Button>
                       <Button variant="secondary" onClick={onImportClick} className="flex-1">Import Data</Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">Export your data to a JSON file for backup. Importing will overwrite existing data.</p>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;