import React, { useState, useMemo } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Card from '../components/Card';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { EditIcon, TrashIcon } from '../components/icons';
import { formatCurrency } from '../lib/utils';

const ExpensesView = ({ showToast }) => {
    const { projects, expenses, updateExpense, deleteExpense, currencySettings } = useStore();
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editFormState, setEditFormState] = useState({
        projectId: '',
        amount: '',
        date: '',
        description: '',
        isBillable: false,
    });

    const activeProjects = useMemo(() => projects.filter(p => !p.isArchived), [projects]);

    const projectMap = useMemo(() => {
        return projects.reduce((acc, proj) => {
            acc[proj.id] = proj.name;
            return acc;
        }, {});
    }, [projects]);

    const openEditDialog = (expense) => {
        setEditingExpense(expense);
        setEditFormState({
            projectId: expense.projectId,
            amount: expense.amount,
            date: expense.date,
            description: expense.description || '',
            isBillable: expense.isBillable || false,
        });
        setIsEditDialogOpen(true);
    };

    const closeEditDialog = () => {
        setEditingExpense(null);
        setIsEditDialogOpen(false);
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        if (!editingExpense) return;

        const amountNum = parseFloat(editFormState.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            showToast("Invalid amount.");
            return;
        }

        await updateExpense(editingExpense.id, {
            ...editFormState,
            amount: amountNum,
        });

        showToast("Expense updated successfully!");
        closeEditDialog();
    };

    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        await deleteExpense(expenseToDelete.id);
        showToast("Expense deleted.");
        setExpenseToDelete(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Expenses</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Track your project-related expenses.</p>

            <Card className="mt-8 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-slate-800">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Project</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {expenses.filter(exp => !exp.isArchived).map(expense => (
                            <tr key={expense.id}>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[expense.projectId] || 'N/A'}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400 text-right font-mono">{formatCurrency(expense.amount, currencySettings.default)}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.description}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{expense.isBilled ? 'Billed' : (expense.isBillable ? 'Billable' : 'Non-billable')}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => openEditDialog(expense)}><EditIcon className="w-4 h-4" /></Button>
                                        <Button variant="ghost" className="px-2" onClick={() => setExpenseToDelete(expense)}><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Dialog isOpen={isEditDialogOpen} onClose={closeEditDialog} title="Edit Expense">
                <form onSubmit={handleUpdateExpense} className="space-y-4">
                    <div>
                        <Label htmlFor="editProject">Project</Label>
                        <Select id="editProject" value={editFormState.projectId} onChange={e => setEditFormState({ ...editFormState, projectId: e.target.value })} disabled>
                            {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="editAmount">Amount</Label>
                        <Input id="editAmount" type="number" step="0.01" value={editFormState.amount} onChange={e => setEditFormState({ ...editFormState, amount: e.target.value })} required />
                    </div>
                    <div>
                        <Label htmlFor="editDate">Date</Label>
                        <Input id="editDate" type="date" value={editFormState.date} onChange={e => setEditFormState({ ...editFormState, date: e.target.value })} required />
                    </div>
                    <div>
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea id="editDescription" value={editFormState.description} onChange={e => setEditFormState({ ...editFormState, description: e.target.value })} />
                    </div>
                    <div className="flex items-center">
                        <input id="editIsBillable" type="checkbox" checked={editFormState.isBillable} onChange={e => setEditFormState({ ...editFormState, isBillable: e.target.checked })} disabled={editingExpense?.isBilled} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                        <Label htmlFor="editIsBillable" className="ml-2">This expense is billable to the client</Label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={closeEditDialog}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Dialog>

            <Dialog isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} title="Delete Expense">
                <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="secondary" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
                </div>
            </Dialog>
        </div>
    );
};

export default ExpensesView;