import React, { useState } from 'react';
import useStore from '../store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import EditIcon from '../components/icons/EditIcon';
import TrashIcon from '../components/icons/TrashIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import CheckIcon from '../components/icons/CheckIcon';
import { formatCurrency, CURRENCIES } from '../lib/utils';
import { invoiceTranslations } from '../lib/invoiceTranslations';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const RecurringInvoicesView = ({ showToast }) => {
    const { clients, recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice, userProfile, taxSettings, currencySettings } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [recurringToDelete, setRecurringToDelete] = useState(null);
    const [recurringToMark, setRecurringToMark] = useState(null);

    const defaultFormState = {
        clientName: clients.length > 0 ? clients[0].name : '',
        frequency: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        lineItems: [{ description: '', amount: '' }],
        
        status: 'Active',
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
            clientName: rec.clientName,
            frequency: rec.frequency,
            startDate: rec.nextDueDate,
            lineItems: rec.items,
            
            status: rec.status,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const totalAmount = formState.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        if (editingRecurring) {
            const updatedRecurring = {
                ...editingRecurring,
                clientName: formState.clientName,
                frequency: formState.frequency,
                nextDueDate: formState.startDate,
                amount: totalAmount,
                currency: currencySettings.default,
                status: formState.status,
                items: formState.lineItems.map(item => ({...item, amount: parseFloat(item.amount) || 0 }))
            };
            await updateRecurringInvoice(updatedRecurring);
            showToast("Recurring profile updated!");

        } else {
            const newRecurring = {
                id: crypto.randomUUID(),
                clientName: formState.clientName,
                frequency: formState.frequency,
                nextDueDate: formState.startDate,
                amount: totalAmount,
                currency: currencySettings.default,
                status: 'Active',
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

    const handleMarkAsPaid = async (rec) => {
        const newStatus = rec.status === 'Paid' ? 'Active' : 'Paid';
        const updatedRecurring = {
            ...rec,
            status: newStatus,
        };
        await updateRecurringInvoice(updatedRecurring);
        showToast(`Recurring invoice marked as ${newStatus.toLowerCase()}!`);
    };

    const handleConfirmMarkAsPaid = () => {
        if (recurringToMark) {
            handleMarkAsPaid(recurringToMark);
            setRecurringToMark(null);
        }
    };

    const generatePdf = (invoice, client, userProfile, taxSettings) => {
        const doc = new jsPDF();
        // Use the language from the settings prop
        const lang = currencySettings.invoiceLanguage || 'en';
        const t = invoiceTranslations[lang];
        const locale = lang === 'de' ? 'de-DE' : 'en-US';

        const formatLocalizedCurrency = (amount, currency) => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(amount);
        };

        const taxRate = taxSettings.rate / 100;
        let subtotal, taxAmount, totalAmount;

        if (taxSettings.inclusive) {
            totalAmount = invoice.amount;
            subtotal = totalAmount / (1 + taxRate);
            taxAmount = totalAmount - subtotal;
        } else {
            subtotal = invoice.amount;
            taxAmount = subtotal * taxRate;
            totalAmount = subtotal + taxAmount;
        }

        // Add header
        if (userProfile.logo) {
            doc.addImage(userProfile.logo, 'PNG', 14, 10, 40, 20);
        }
        doc.setFontSize(20);
        doc.text(userProfile.companyName, 14, 40);
        doc.setFontSize(12);
        doc.text(userProfile.companyAddress, 14, 48);
        doc.text(userProfile.companyEmail, 14, 56);

        doc.setFontSize(26);
        doc.text(t.invoice, 200, 20, { align: 'right' });
        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoice.id}`, 200, 30, { align: 'right' });
        doc.text(`${t.issueDate}: ${invoice.nextDueDate}`, 200, 38, { align: 'right' });

        // Add client info
        doc.setFontSize(14);
        doc.text(t.billTo, 14, 70);
        doc.setFontSize(12);
        doc.text(client.name, 14, 78);
        doc.text(client.email, 14, 86);

        // Add table
        const tableColumn = [t.description, t.quantity, t.rate, t.amount];
        const tableRows = [];

        invoice.items.forEach(item => {
            const itemData = [
                item.description,
                '1',
                formatLocalizedCurrency(item.amount, invoice.currency),
                formatLocalizedCurrency(item.amount, invoice.currency),
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 100,
        });

        // Add total
        let finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(12);
        doc.text(`${t.subtotal}`, 150, finalY + 10, { align: 'right' });
        doc.text(formatLocalizedCurrency(subtotal, invoice.currency), 200, finalY + 10, { align: 'right' });

        doc.text(`${t.tax} (${taxSettings.rate}%):`, 150, finalY + 18, { align: 'right' });
        doc.text(formatLocalizedCurrency(taxAmount, invoice.currency), 200, finalY + 18, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${t.total}`, 150, finalY + 26, { align: 'right' });
        doc.text(formatLocalizedCurrency(totalAmount, invoice.currency), 200, finalY + 26, { align: 'right' });


        // Add footer
        doc.setFontSize(10);
        doc.text(t.thankYou, 14, doc.internal.pageSize.height - 10);

        doc.save(`recurring-invoice-${invoice.id}.pdf`);
        showToast("PDF generated successfully!");
    };

    const handleDownloadPdf = (rec) => {
        const client = clients.find(c => c.name === rec.clientName);
        generatePdf(rec, client, userProfile, taxSettings);
    };

    const paginatedRecurringInvoices = usePagination(recurringInvoices, 10);

    const statusColors = {
        "Paid": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "Active": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                             <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {paginatedRecurringInvoices.currentData.map(rec => (
                            <tr key={rec.id}>
                                <td className="p-4 font-medium">{rec.clientName}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.frequency}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.nextDueDate}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[rec.status]}`}>
                                        {rec.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono">{formatCurrency(rec.amount, rec.currency)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className={`px-2 ${rec.status === 'Paid' ? 'text-green-500' : 'text-slate-400'}`} onClick={() => setRecurringToMark(rec)}>
                                            <CheckIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2" onClick={() => handleDownloadPdf(rec)}>
                                            <DownloadIcon className="w-4 h-4" />
                                        </Button>
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
                <Pagination
                    currentPage={paginatedRecurringInvoices.currentPage}
                    maxPage={paginatedRecurringInvoices.maxPage}
                    goToPage={paginatedRecurringInvoices.goToPage}
                    nextPage={paginatedRecurringInvoices.nextPage}
                    prevPage={paginatedRecurringInvoices.prevPage}
                />
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
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">{CURRENCIES.find(c => c.code === currencySettings.default)?.symbol || '$'}</span>
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
            <Dialog isOpen={!!recurringToMark} onClose={() => setRecurringToMark(null)} title={`Mark as ${recurringToMark?.status === 'Paid' ? 'Active' : 'Paid'}`}>
                <p>Are you sure you want to mark this recurring profile as {recurringToMark?.status === 'Paid' ? 'Active' : 'Paid'}?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setRecurringToMark(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirmMarkAsPaid}>Yes</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default RecurringInvoicesView;