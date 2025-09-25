import React, { useState, useEffect, useMemo } from 'react';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import { formatCurrency } from '../lib/utils';

const BillableItemsModal = ({ isOpen, onClose, unbilledEntries, unbilledExpenses, onCreateInvoice, currency }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Pre-select all items when modal opens
            const allItems = [
                ...unbilledEntries.map(entry => ({ ...entry, type: 'time' })),
                ...unbilledExpenses.map(expense => ({ ...expense, type: 'expense' }))
            ];
            setSelectedItems(allItems);
        }
    }, [isOpen, unbilledEntries, unbilledExpenses]);

    const handleSelectItem = (item, type) => {
        setSelectedItems(prevSelectedItems => {
            const isSelected = prevSelectedItems.some(i => i.id === item.id && i.type === type);
            if (isSelected) {
                return prevSelectedItems.filter(i => !(i.id === item.id && i.type === type));
            } else {
                return [...prevSelectedItems, { ...item, type }];
            }
        });
    };

    const handleCreateInvoice = () => {
        const selectedEntries = selectedItems.filter(i => i.type === 'time').map(({ type, ...rest }) => rest);
        const selectedExpenses = selectedItems.filter(i => i.type === 'expense').map(({ type, ...rest }) => rest);
        onCreateInvoice(selectedEntries, selectedExpenses);
    };

    const totalSelectedAmount = useMemo(() => {
        return selectedItems.reduce((sum, item) => {
            if (item.type === 'time') {
                 return sum + (item.hours * item.rate);
            }
            return sum + item.amount;
        }, 0);
    }, [selectedItems]);


    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Select Items to Invoice">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {unbilledEntries.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Unbilled Time</h3>
                        <div className="border dark:border-slate-700 rounded-md p-2 space-y-1">
                            {unbilledEntries.map(entry => {
                                const rate = entry.rate;
                                const checkId = `time-check-${entry.id}`;
                                return (
                                    <div key={`time-${entry.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <div className="flex items-center flex-grow">
                                            <input
                                                id={checkId}
                                                type="checkbox"
                                                checked={selectedItems.some(i => i.id === entry.id && i.type === 'time')}
                                                onChange={() => handleSelectItem(entry, 'time')}
                                                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 mr-3"
                                            />
                                            <label htmlFor={checkId} className="flex-grow cursor-pointer">
                                                <p>Work done on {new Date(entry.start_time).toLocaleDateString()}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.hours.toFixed(2)} hours at {formatCurrency(rate, currency)}/hr</p>
                                            </label>
                                        </div>
                                        <p className="font-mono ml-4">{formatCurrency(entry.hours * rate, currency)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {unbilledExpenses.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Billable Expenses</h3>
                         <div className="border dark:border-slate-700 rounded-md p-2 space-y-1">
                            {unbilledExpenses.map(expense => {
                                const checkId = `exp-check-${expense.id}`;
                                return (
                                     <div key={`exp-${expense.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <div className="flex items-center flex-grow">
                                            <input
                                                id={checkId}
                                                type="checkbox"
                                                checked={selectedItems.some(i => i.id === expense.id && i.type === 'expense')}
                                                onChange={() => handleSelectItem(expense, 'expense')}
                                                className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 mr-3"
                                            />
                                            <label htmlFor={checkId} className="flex-grow cursor-pointer">
                                                <p>{expense.description} on {expense.date}</p>
                                            </label>
                                        </div>
                                        <p className="font-mono ml-4">{formatCurrency(expense.amount, currency)}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                 {(unbilledEntries.length === 0 && unbilledExpenses.length === 0) && (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">No unbilled items found for this client and currency.</p>
                )}
            </div>
            <div className="flex justify-between items-center mt-6">
                <div>
                     <span className="text-lg font-semibold">Total: </span>
                     <span className="text-lg font-bold font-mono">{formatCurrency(totalSelectedAmount, currency)}</span>
                </div>
                <div className="flex gap-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreateInvoice} disabled={selectedItems.length === 0}>
                        Create Invoice for {formatCurrency(totalSelectedAmount, currency)}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};

export default BillableItemsModal;