import React from 'react';
import KanbanCard from './KanbanCard';
import { useDroppable } from '@dnd-kit/core';

const KanbanColumn = ({ title, tasks, setEditingTask, setIsTaskDialogOpen, deleteTask, projectId }) => {
    const { setNodeRef } = useDroppable({ id: title });

    return (
        <div ref={setNodeRef} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-200 mb-4">{title}</h3>
            <div className="space-y-4">
                {tasks.map(task => (
                    <KanbanCard key={task.id} task={task} setEditingTask={setEditingTask} setIsTaskDialogOpen={setIsTaskDialogOpen} deleteTask={deleteTask} projectId={projectId} />
                ))}
            </div>
        </div>
    );
};

export default KanbanColumn;