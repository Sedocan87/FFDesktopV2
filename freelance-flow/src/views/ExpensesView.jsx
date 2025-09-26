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
    const { projects, expenses, addExpense, updateExpense, deleteExpense, setIsAddExpenseDialogOpen, setEditingExpense, currencySettings } = useStore();
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    

    const projectMap = projects.reduce((acc, proj) => {
        acc[proj.id] = {name: proj.name };
        return acc;
    }, {});

    

    const handleDeleteExpense = async () => {
        if (expenseToDelete) {
            await deleteExpense(expenseToDelete.id);
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
                <Button onClick={() => { setIsAddExpenseDialogOpen(true); setEditingExpense(null); }}>Add New Expense</Button>
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
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{projectMap[expense.project_id]?.name || 'N/A'}</td>
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
                                    {formatCurrency(expense.amount, currencySettings.default)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="px-2" onClick={() => { setIsAddExpenseDialogOpen(true); setEditingExpense(expense); }}>
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