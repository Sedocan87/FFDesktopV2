import React, { useState, useMemo } from 'react';
import useStore from '../store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Select from '../components/Select';
import Label from '../components/Label';
import InvoiceDetailView from './InvoiceDetailView';
import RecurringInvoicesView from './RecurringInvoicesView';
import BillableItemsModal from './BillableItemsModal';
import { formatCurrency } from '../lib/utils';
import { invoiceTranslations } from '../lib/invoiceTranslations';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { EyeIcon, CheckIcon, DownloadIcon, TrashIcon } from '../components/icons';

const InvoicesView = ({ showToast }) => {
    const { projects, clients, timeEntries, invoices, addInvoice, updateInvoice, deleteInvoice,
        expenses, userProfile, recurringInvoices, setRecurringInvoices,
        currencySettings, taxSettings, setTimeEntries, setExpenses, setIsNewInvoiceDialogOpen
    } = useStore();
    const [viewingInvoice, setViewingInvoice] = useState(null);
    const [invoiceToMark, setInvoiceToMark] = useState(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('one-time');

    const handleStatusChange = async (invoiceId, newStatus) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            await updateInvoice({ ...invoice, status: newStatus });
            setViewingInvoice(prev => prev ? {...prev, status: newStatus} : null);
            showToast(`Invoice ${invoiceId} marked as ${newStatus}.`);
        }
    };

    const handleConfirmMarkAsPaid = () => {
        if (invoiceToMark) {
            const newStatus = invoiceToMark.status === 'Paid' ? 'Draft' : 'Paid';
            handleStatusChange(invoiceToMark.id, newStatus);
            setInvoiceToMark(null);
        }
    };

    const handleDeleteInvoice = async () => {
        if (invoiceToDelete) {
            await deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
            showToast("Invoice deleted.");
        }
    };

    const statusColors = {
        "Paid": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "Draft": "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        "Overdue": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    const activeInvoices = useMemo(() => invoices.filter(invoice => !invoice.isArchived), [invoices]);
    const paginatedInvoices = usePagination(activeInvoices, 10);

    return (
        <div>
            {viewingInvoice ? (
                <InvoiceDetailView
                    invoice={viewingInvoice}
                    client={clients.find(c => c.name === viewingInvoice.clientName)}
                    onBack={() => setViewingInvoice(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={() => setInvoiceToDelete(viewingInvoice)}
                    userProfile={userProfile}
                    taxSettings={taxSettings}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Invoices</h1>
                            <p className="mt-1 text-slate-600 dark:text-slate-400">Create and manage your client invoices.</p>
                        </div>
                        <Button onClick={() => setIsNewInvoiceDialogOpen(true)}>Create New Invoice</Button>
                    </div>

                    <div className="border-b dark:border-slate-800 mb-6">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('one-time')}
                                className={`${
                                    activeTab === 'one-time'
                                        ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                One-Time Invoices
                            </button>
                            <button
                                onClick={() => setActiveTab('recurring')}
                                className={`${
                                    activeTab === 'recurring'
                                        ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Recurring Invoices
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'one-time' && (
                        <>
                        
                        <Card className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b dark:border-slate-800">
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Invoice ID</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Issue Date</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {paginatedInvoices.currentData.map(invoice => (
                                        <tr key={invoice.id}>
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-100 font-mono">{invoice.id}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{invoice.clientName}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{invoice.issueDate}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">{formatCurrency(invoice.amount, invoice.currency)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" className="px-2" onClick={() => handleDownloadPdf(invoice)}>
                                                        <DownloadIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className="px-2" onClick={() => setViewingInvoice(invoice)}>
                                                        <EyeIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className={`px-2 ${invoice.status === 'Paid' ? 'text-green-500' : 'text-slate-400'}`} onClick={() => setInvoiceToMark(invoice)}>
                                                        <CheckIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" className="px-2" onClick={() => setInvoiceToDelete(invoice)}>
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             <Pagination
                                currentPage={paginatedInvoices.currentPage}
                                maxPage={paginatedInvoices.maxPage}
                                goToPage={paginatedInvoices.goToPage}
                                nextPage={paginatedInvoices.nextPage}
                                prevPage={paginatedInvoices.prevPage}
                            />
                        </Card>
                        </>
                    )}

                    {activeTab === 'recurring' && (
                        <RecurringInvoicesView clients={clients} recurringInvoices={recurringInvoices} setRecurringInvoices={setRecurringInvoices} showToast={showToast} />
                    )}
                </>
            )}

            <Dialog isOpen={!!invoiceToDelete} onClose={() => setInvoiceToDelete(null)} title="Delete Invoice">
                <p>Are you sure you want to delete invoice "{invoiceToDelete?.id}"? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setInvoiceToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteInvoice}>Delete</Button>
                </div>
            </Dialog>

            <Dialog isOpen={!!invoiceToMark} onClose={() => setInvoiceToMark(null)} title={`Mark Invoice as ${invoiceToMark?.status === 'Paid' ? 'Unpaid' : 'Paid'}`}>
                <p>Are you sure you want to mark invoice "{invoiceToMark?.id}" as {invoiceToMark?.status === 'Paid' ? 'unpaid' : 'paid'}?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setInvoiceToMark(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirmMarkAsPaid}>Yes</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default InvoicesView;