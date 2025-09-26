import React, { useState, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';

const AddExpenseDialog = ({ showToast }) => {
    const { projects, addExpense, updateExpense, isAddExpenseDialogOpen, setIsAddExpenseDialogOpen, editingExpense, setEditingExpense } = useStore();

    const [formProjectId, setFormProjectId] = useState(projects.length > 0 ? projects[0].id : '');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formDescription, setFormDescription] = useState('');
    const [formIsBillable, setFormIsBillable] = useState(true);

    useEffect(() => {
        if (editingExpense) {
            setFormProjectId(editingExpense.project_id);
            setFormAmount(editingExpense.amount);
            setFormDate(editingExpense.date);
            setFormDescription(editingExpense.description);
            setFormIsBillable(editingExpense.isBillable);
        } else {
            setFormProjectId(projects.length > 0 ? projects[0].id : '');
            setFormAmount('');
            setFormDate(new Date().toISOString().split('T')[0]);
            setFormDescription('');
            setFormIsBillable(true);
        }
    }, [editingExpense, projects]);

    const closeDialog = () => {
        setIsAddExpenseDialogOpen(false);
        setEditingExpense(null);
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        const amountNum = parseFloat(formAmount);
        if (formDescription.trim() && formProjectId && !isNaN(amountNum) && amountNum > 0) {
            if (editingExpense) {
                const updatedExpense = {
                    ...editingExpense,
                    project_id: formProjectId,
                    amount: amountNum,
                    date: formDate,
                    description: formDescription,
                    isBillable: formIsBillable,
                };
                await updateExpense(updatedExpense);
                showToast("Expense updated!");
            } else {
                const newExpense = {
                    id: crypto.randomUUID(),
                    project_id: formProjectId,
                    amount: amountNum,
                    date: formDate,
                    description: formDescription,
                    isBilled: false,
                    isBillable: formIsBillable,
                };
                await addExpense(newExpense);
                showToast("Expense added!");
            }
            closeDialog();
        }
    };

    return (
        <Dialog isOpen={isAddExpenseDialogOpen} onClose={closeDialog} title={editingExpense ? "Edit Expense" : "Add New Expense"}>
            <form onSubmit={handleSaveExpense} className="space-y-4">
                <div>
                    <Label htmlFor="expenseProject">Project</Label>
                    <Select id="expenseProject" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
    );
};

export default AddExpenseDialog;