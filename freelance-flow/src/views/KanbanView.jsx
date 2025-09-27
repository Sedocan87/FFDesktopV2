import React, { useState } from 'react';
import useStore from '../store';
import KanbanColumn from '../components/KanbanColumn';
import Button from '../components/Button';
import TaskDialog from '../components/TaskDialog';
import Dialog from '../components/Dialog';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

const KanbanView = () => {
    const { activeProject, setActiveProject, deleteTask, updateTask, setTasks } = useStore();
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    if (!activeProject) {
        return <div>No project selected</div>;
    }

    const columns = {
        'To Do': (activeProject.tasks || []).filter(t => t.status === 'To Do'),
        'In Progress': (activeProject.tasks || []).filter(t => t.status === 'In Progress'),
        'Done': (activeProject.tasks || []).filter(t => t.status === 'Done'),
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const task = (activeProject.tasks || []).find(t => t.id === active.id);
            if (task.status !== over.id) {
                updateTask(activeProject.id, active.id, { status: over.id });
            }
        }
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button onClick={() => setActiveProject(null)} className="text-sm text-slate-500 hover:underline">Back to Projects</button>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{activeProject.name}</h1>
                    </div>
                    <Button onClick={() => { setEditingTask(null); setIsTaskDialogOpen(true); }}>Create Task</Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-8">
                    {Object.entries(columns).map(([title, tasks]) => (
                        <KanbanColumn key={title} title={title} tasks={tasks} setEditingTask={setEditingTask} setIsTaskDialogOpen={setIsTaskDialogOpen} deleteTask={setTaskToDelete} projectId={activeProject.id} />
                    ))}
                </div>

                <TaskDialog 
                    isOpen={isTaskDialogOpen} 
                    onClose={() => setIsTaskDialogOpen(false)} 
                    task={editingTask} 
                    projectId={activeProject.id} 
                />

                <Dialog isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} title="Delete Task">
                    <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="secondary" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { deleteTask(activeProject.id, taskToDelete); setTaskToDelete(null); }}>Delete</Button>
                    </div>
                </Dialog>
            </div>
        </DndContext>
    );
};

export default KanbanView;