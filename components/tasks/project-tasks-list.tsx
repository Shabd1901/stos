'use client';

import { useState } from 'react';
import { Task } from '@/lib/api/types';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Plus, CheckSquare, Trash2 } from 'lucide-react';

interface ProjectTasksListProps {
    projectId: string;
    initialTasks: Task[];
}

export function ProjectTasksList({ projectId, initialTasks }: ProjectTasksListProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const { toast } = useToast();
    const router = useRouter();

    // Sort tasks: To-do first, then completed. By created_at descending second.
    const sortedTasks = [...tasks].sort((a, b) => {
        const aDone = a.status === 'done' ? 1 : 0;
        const bDone = b.status === 'done' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    const handleToggleTask = async (task: Task, isCompleted: boolean) => {
        const newStatus = isCompleted ? 'done' : 'todo';

        // Optimistic UI update
        setTasks(current => current.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', task.id);

            if (error) throw error;
            router.refresh();
        } catch (err: any) {
            // Revert on error
            setTasks(current => current.map(t => t.id === task.id ? { ...t, status: task.status } : t));
            toast({
                title: 'Failed to update task',
                description: err.message,
                variant: 'destructive'
            });
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || isAdding) return;

        setIsAdding(true);

        const tempId = `temp-${Date.now()}`;
        const tempTask = {
            id: tempId,
            title: newTaskTitle.trim(),
            project_id: projectId,
            status: 'todo' as const,
            priority: 'medium' as const,
            created_at: new Date().toISOString()
        } as Task;

        // Optimistic addition
        setTasks(current => [tempTask, ...current]);
        setNewTaskTitle('');

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{
                    title: tempTask.title,
                    project_id: projectId,
                    status: 'todo',
                    priority: 'medium'
                }])
                .select()
                .single();

            if (error) throw error;

            // Replace temp with real
            setTasks(current => current.map(t => t.id === tempId ? data : t));
            router.refresh();
        } catch (err: any) {
            // Revert addition
            setTasks(current => current.filter(t => t.id !== tempId));
            toast({
                title: 'Failed to add task',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        // Optimistic delete
        const snapshot = [...tasks];
        setTasks(current => current.filter(t => t.id !== taskId));

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            router.refresh();
        } catch (err: any) {
            // Revert delete
            setTasks(snapshot);
            toast({
                title: 'Failed to delete task',
                description: err.message,
                variant: 'destructive'
            });
        }
    };

    return (
        <Card>
            <div className="border-b border-border p-4 sm:p-6 flex justify-between items-center bg-card rounded-t-xl">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    Project Tasks
                </h2>
                <div className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {tasks.filter(t => t.status === 'done').length} / {tasks.length}
                </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
                <form onSubmit={handleAddTask} className="flex gap-2">
                    <Input
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        disabled={isAdding}
                        className="flex-1 bg-background"
                    />
                    <Button type="submit" disabled={isAdding || !newTaskTitle.trim()}>
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Task</span>
                    </Button>
                </form>

                <div className="space-y-2 mt-6 max-h-[400px] overflow-y-auto pr-2">
                    {sortedTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg border-border">
                            No tasks for this project yet.
                        </div>
                    ) : (
                        sortedTasks.map(task => {
                            const isDone = task.status === 'done';
                            return (
                                <div
                                    key={task.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDone
                                        ? 'bg-muted/30 border-border opacity-70'
                                        : 'bg-card border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <Checkbox
                                            checked={isDone}
                                            onCheckedChange={(checked) => handleToggleTask(task, checked as boolean)}
                                        />
                                        <span className={`text-sm truncate ${isDone ? 'line-through text-muted-foreground' : 'font-medium text-foreground'}`}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-50 hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteTask(task.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Card>
    );
}
