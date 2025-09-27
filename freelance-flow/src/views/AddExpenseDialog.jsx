import React, { useState, useEffect } from 'react';
import useStore from '../store';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import Input from '../components/Input';
import Label from '../components/Label';
import Select from '../components/Select';
import Textarea from '../components/Textarea';

const AddExpenseDialog = ({ showToast }) => {
    const { projects, addExpense, isAddExpenseDialogOpen, setIsAddExpenseDialogOpen } = useStore();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProject, setSelectedProject] = useState('');

    const activeProjects = React.useMemo(() => projects.filter(p => !p.isArchived), [projects]);

    useEffect(() => {
        if (activeProjects.length > 0 && !selectedProject) {
            setSelectedProject(activeProjects[0].id);
        }
    }, [activeProjects, selectedProject]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const amountNum = parseFloat(amount);
        if (!selectedProject || !amount || isNaN(amountNum) || amountNum <= 0) {
            showToast("Invalid expense details.");
            return;
        }

        await addExpense({
            projectId: selectedProject,
            amount: amountNum,
            description,
            date,
            isBilled: false,
            isBillable: true, // This was missing
            createdAt: new Date().toISOString(),
        });

        setAmount('');
        setDescription('');
        showToast("Expense added successfully!");
        setIsAddExpenseDialogOpen(false);
    };

    return (
        <Dialog isOpen={isAddExpenseDialogOpen} onClose={() => setIsAddExpenseDialogOpen(false)} title="Add New Expense">
            <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                    <Label htmlFor="expenseProject">Project</Label>
                    <Select id="expenseProject" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                        {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="expenseAmount">Amount</Label>
                    <Input id="expenseAmount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="expenseDate">Date</Label>
                    <Input id="expenseDate" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="expenseDescription">Description</Label>
                    <Textarea id="expenseDescription" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsAddExpenseDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Expense</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default AddExpenseDialog;