import React, { useState } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import EditIcon from '../components/icons/EditIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { formatCurrency } from '../lib/utils';

const ExpensesView = ({ showToast }) => {
    const { projects, expenses, setExpenses } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const [formProjectId, setFormProjectId] = useState(projects.length > 0 ? projects[0].id : '');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formDescription, setFormDescription] = useState('');
    const [formIsBillable, setFormIsBillable] = useState(true);

    const projectMap = projects.reduce((acc, proj) => {
        acc[proj.id] = {name: proj.name, currency: proj.currency };
        return acc;
    }, {});

    const openAddDialog = () => {
        setEditingExpense(null);
        setFormProjectId(projects.length > 0 ? projects[0].id : '');
        setFormAmount('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormDescription('');
        setFormIsBillable(true);
        setIsDialogOpen(true);
    };

    const openEditDialog = (expense) => {
        setEditingExpense(expense);
        setFormProjectId(expense.projectId);
        setFormAmount(expense.amount);
        setFormDate(expense.date);
        setFormDescription(expense.description);
        setFormIsBillable(expense.isBillable);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingExpense(null);
    };

    const handleSaveExpense = (e) => {
        e.preventDefault();
        const amountNum = parseFloat(formAmount);
        if (formDescription.trim() && formProjectId && !isNaN(amountNum) && amountNum > 0) {
            if (editingExpense) {
                setExpenses(expenses.map(ex => ex.id === editingExpense.id ? { ...ex, projectId: parseInt(formProjectId), amount: amountNum, date: formDate, description: formDescription, isBillable: formIsBillable } : ex));
                showToast("Expense updated!");
            } else {
                const newExpense = {
                    id: expenses.length > 0 ? Math.max(...expenses.map(ex => ex.id)) + 1 : 1,
                    projectId: parseInt(formProjectId),
                    amount: amountNum,
                    date: formDate,
                    description: formDescription,
                    isBilled: false,
                    isBillable: formIsBillable,
                };
                setExpenses([newExpense, ...expenses]);
                showToast("Expense added!");
            }
            closeDialog();
        }
    };

    const handleDeleteExpense = () => {
        if (expenseToDelete) {
            setExpenses(expenses.filter(ex => ex.id !== expenseToDelete.id));
            setExpenseToDelete(null);
            showToast("Expense deleted.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Expenses</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Track your project-related expenses.</p>
                </div>
                <Button onClick={openAddDialog}>Add New Expense</Button>
            </div>

            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[expense.projectId]?.name || 'N/A'}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.description}</td>
                                 <td className="p-4 text-slate-600 dark:text-slate-400">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        expense.isBillable
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                    }`}>
                                        {expense.isBillable ? 'Billable' : 'Internal Cost'}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.date}</td>
                                <td className="p-4 text-slate-800 dark:text-slate-100 text-right font-mono">
                                    {formatCurrency(expense.amount, projectMap[expense.projectId]?.currency || 'USD')}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(expense)}>
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" className="px-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => setExpenseToDelete(expense)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={closeDialog} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
                <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div>
                        <Label htmlFor="expenseProject">Project</Label>
                        <Select id="expenseProject" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>)}
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="expenseDescription">Description</Label>
                        <Input id="expenseDescription" type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label htmlFor="expenseAmount">Amount</Label>
                           <Input id="expenseAmount" type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required />
                        </div>
                        <div>
                           <Label htmlFor="expenseDate">Date</Label>
                           <Input id="expenseDate" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                    </div>
                     <div className="flex items-center mt-4">
                        <input
                            id="isBillable"
                            type="checkbox"
                            checked={formIsBillable}
                            onChange={(e) => setFormIsBillable(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                        />
                        <Label htmlFor="isBillable" className="ml-2 mb-0">This expense is billable to the client</Label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                        <Button type="submit">{editingExpense ? "Save Changes" : "Add Expense"}</Button>
                    </div>
                </form>
            </Dialog>

             <Dialog isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} title="Delete Expense">
                <p>Are you sure you want to delete this expense: "{expenseToDelete?.description}"?</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default ExpensesView;