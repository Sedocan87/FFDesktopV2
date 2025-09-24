import React, { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import EditIcon from '../components/icons/EditIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { formatCurrency, CURRENCIES } from '../lib/utils';

const RecurringInvoicesView = ({ showToast }) => {
    const { clients, recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [recurringToDelete, setRecurringToDelete] = useState(null);

    const defaultFormState = {
        clientName: clients.length > 0 ? clients[0].name : '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        lineItems: [{ description: '', amount: '' }],
        currency: 'USD',
    };

    const [formState, setFormState] = useState(defaultFormState);

    const handleAddItem = () => setFormState(prev => ({...prev, lineItems: [...prev.lineItems, {description: '', amount: ''}]}));
    const handleRemoveItem = (index) => setFormState(prev => ({...prev, lineItems: prev.lineItems.filter((_, i) => i !== index)}));
    const handleItemChange = (index, field, value) => {
        const newItems = [...formState.lineItems];
        newItems[index][field] = value;
        setFormState(prev => ({...prev, lineItems: newItems}));
    };

    const handleFormStateChange = (e) => {
        setFormState(prev => ({...prev, [e.target.id]: e.target.value }));
    };

    const openAddDialog = () => {
        setEditingRecurring(null);
        setFormState(defaultFormState);
        setIsDialogOpen(true);
    };

    const openEditDialog = (rec) => {
        setEditingRecurring(rec);
        setFormState({
            clientName: rec.client_name,
            frequency: rec.frequency,
            startDate: rec.next_due_date,
            lineItems: rec.items,
            currency: rec.currency,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const totalAmount = formState.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        if (editingRecurring) {
            const updatedRecurring = {
                ...editingRecurring,
                client_name: formState.clientName,
                frequency: formState.frequency,
                next_due_date: formState.startDate,
                amount: totalAmount,
                currency: formState.currency,
                items: formState.lineItems.map(item => ({...item, amount: parseFloat(item.amount) || 0 }))
            };
            await updateRecurringInvoice(updatedRecurring);
            showToast("Recurring profile updated!");

        } else {
            const newRecurring = {
                id: recurringInvoices.length > 0 ? Math.max(...recurringInvoices.map(i => i.id)) + 1 : 1,
                client_name: formState.clientName,
                frequency: formState.frequency,
                next_due_date: formState.startDate,
                amount: totalAmount,
                currency: formState.currency,
                items: formState.lineItems.map(item => ({...item, amount: parseFloat(item.amount) || 0 }))
            };
            await addRecurringInvoice(newRecurring);
            showToast("Recurring profile created!");
        }

        setIsDialogOpen(false);
    };

    const handleDelete = async () => {
        if (recurringToDelete) {
            await deleteRecurringInvoice(recurringToDelete.id);
            setRecurringToDelete(null);
            showToast("Recurring profile deleted.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recurring Profiles</h2>
                 <Button onClick={openAddDialog}>Create Profile</Button>
            </div>
             <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Frequency</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Next Due Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                             <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {recurringInvoices.map(rec => (
                            <tr key={rec.id}>
                                <td className="p-4 font-medium">{rec.clientName}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.frequency}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.nextDueDate}</td>
                                <td className="p-4 text-right font-mono">{formatCurrency(rec.amount, rec.currency)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(rec)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setRecurringToDelete(rec)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
             <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={editingRecurring ? "Edit Recurring Profile" : "Create Recurring Profile"}>
                <form onSubmit={handleSave} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="clientName">Client</Label>
                           <Select id="clientName" value={formState.clientName} onChange={handleFormStateChange}>
                               {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </Select>
                       </div>
                       <div>
                           <Label htmlFor="currency">Currency</Label>
                           <Select id="currency" value={formState.currency} onChange={handleFormStateChange}>
                               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                           </Select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select id="frequency" value={formState.frequency} onChange={handleFormStateChange}>
                                <option>Monthly</option>
                                <option>Quarterly</option>
                                <option>Annually</option>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" type="date" value={formState.startDate} onChange={handleFormStateChange} />
                        </div>
                    </div>
                    <div>
                        <Label>Line Items</Label>
                        <div className="space-y-2">
                        {formState.lineItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="flex-grow"/>
                                <div className="relative">
                                    <Input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} className="w-28 pl-7"/>
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{CURRENCIES.find(c => c.code === formState.currency)?.symbol || '$'}</span>
                                </div>
                                <Button type="button" variant="ghost" onClick={() => handleRemoveItem(index)} className="text-red-500"><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        ))}
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddItem} className="mt-2 text-sm">Add Item</Button>
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Profile</Button>
                    </div>
                </form>
            </Dialog>
            <Dialog isOpen={!!recurringToDelete} onClose={() => setRecurringToDelete(null)} title="Delete Recurring Profile">
                 <p>Are you sure you want to delete this recurring profile for {recurringToDelete?.clientName}?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setRecurringToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default RecurringInvoicesView;