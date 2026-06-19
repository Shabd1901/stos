'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { AgencyUser } from '@/lib/auth';

interface NewTaskDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function NewTaskDialog({ children, open, onOpenChange }: NewTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [users, setUsers] = useState<AgencyUser[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [projectId, setProjectId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    const router = useRouter();
    const { toast } = useToast();

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchUsers();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        const { data, error } = await supabase.from('projects').select('id, name').order('name');
        if (!error && data) {
            setProjects(data);
        }
    };

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('agency_users').select('id, name, email, role').order('name');
        if (!error && data) {
            setUsers(data as AgencyUser[]);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
        if (!newOpen) {
            // Reset form
            setTitle('');
            setProjectId('');
            setAssignedTo('');
            setDueDate('');
        }
    };

    const handleSaveTask = async () => {
        if (!title || !projectId) {
            toast({
                title: 'Missing fields',
                description: 'Please provide a task title and select a project.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('tasks').insert([{
                title,
                project_id: projectId,
                assignee_id: assignedTo || null,
                due_date: dueDate || null,
                status: 'todo',
                priority: 'medium',
                description: ''
            }]);

            if (error) throw error;

            toast({
                title: 'Task Created',
                description: 'The new task has been added successfully.',
            });

            router.refresh();
            handleOpenChange(false);
        } catch (error: any) {
            toast({
                title: 'Error creating task',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                {children && <DialogTrigger asChild>{children}</DialogTrigger>}
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                            Assign a new task to your team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input
                                id="task-title"
                                placeholder="Design homepage mockups"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Project</Label>
                            {projects.length > 0 ? (
                                <Select value={projectId} onValueChange={setProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground flex items-center justify-between">
                                    <span>No projects found.</span>
                                    <Button variant="outline" size="sm" onClick={() => setProjectDialogOpen(true)}>
                                        Create Project
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Assignee</Label>
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="due-date">Due Date</Label>
                            <Input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSaveTask} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <NewProjectDialog
                open={projectDialogOpen}
                onOpenChange={(open) => {
                    setProjectDialogOpen(open);
                    if (!open) fetchProjects();
                }}
            />
        </>
    );
}
