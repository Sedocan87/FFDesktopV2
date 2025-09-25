import React from 'react';
import Card from '../components/Card';
import { formatCurrency } from '../lib/utils';

const TaxEstimator = ({ invoices, taxSettings, currencySettings }) => {
    const today = new Date();
    const year = today.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    const ytdRevenue = invoices
        .filter(inv => {
            const issueDate = new Date(inv.issueDate);
            return inv.status === 'Paid' && issueDate >= startOfYear && inv.currency === currencySettings.default;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

    const estimatedTax = ytdRevenue * (taxSettings.rate / 100);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">YTD Tax to be Paid</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{year} (in your default currency: {currencySettings.default})</p>
            <div className="mt-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 dark:text-slate-300">YTD Revenue:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(ytdRevenue, currencySettings.default)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                    <span className="text-slate-600 dark:text-slate-300">Estimated Tax Rate:</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{taxSettings.rate}%</span>
                </div>
                <div className="border-t dark:border-slate-800 my-3"></div>
                <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-800 dark:text-white">Estimated Tax Owed:</span>
                    <span className="font-bold text-2xl text-slate-900 dark:text-slate-200">{formatCurrency(estimatedTax, currencySettings.default)}</span>
                </div>
            </div>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
                This is a simple estimate based on paid invoices and is not professional tax advice.
            </p>
        </Card>
    );
};

export default TaxEstimator;