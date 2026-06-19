'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/api/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface EditProjectDialogProps {
    children?: React.ReactNode;
    project: Project;
}

export function EditProjectDialog({ children, project }: EditProjectDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState(project.status || 'planning');
    const [projectType, setProjectType] = useState<string>(project.project_type || 'website');
    const [priority, setPriority] = useState(project.priority || 'medium');
    const [budget, setBudget] = useState(project.budget?.toString() || '0');
    const [startDate, setStartDate] = useState(project.start_date || '');
    const [deadline, setDeadline] = useState(project.deadline || '');
    const [progress, setProgress] = useState(project.progress?.toString() || '0');
    const [maintenanceEnabled, setMaintenanceEnabled] = useState(project.maintenance_enabled || false);

    const { toast } = useToast();
    const router = useRouter();

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset to current project values
            setName(project.name);
            setDescription(project.description || '');
            setStatus(project.status || 'planning');
            setProjectType(project.project_type || 'website');
            setPriority(project.priority || 'medium');
            setBudget(project.budget?.toString() || '0');
            setStartDate(project.start_date || '');
            setDeadline(project.deadline || '');
            setProgress(project.progress?.toString() || '0');
            setMaintenanceEnabled(project.maintenance_enabled || false);
        }
    };

    const handleSaveProject = async () => {
        if (!name) {
            toast({
                title: 'Missing fields',
                description: 'Project name is required.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const updates = {
                name,
                description,
                status,
                project_type: projectType,
                priority,
                budget: parseFloat(budget) || 0,
                progress: parseInt(progress) || 0,
                start_date: startDate || null,
                deadline: deadline || null,
                maintenance_enabled: maintenanceEnabled
            };

            const { error } = await supabase.from('projects')
                .update(updates)
                .eq('id', project.id);

            if (error) throw error;

            toast({
                title: 'Project Updated',
                description: 'The project settings have been saved successfully.',
            });

            router.refresh();
            setIsOpen(false);
        } catch (error: any) {
            toast({
                title: 'Error updating project',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone and will delete associated tasks and payments.')) {
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('projects').delete().eq('id', project.id);
            if (error) throw error;

            toast({
                title: 'Project Deleted',
                description: 'The project has been permanently removed.',
            });

            setIsOpen(false);
            router.push('/projects');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error deleting project',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="w-[95vw] max-w-2xl sm:max-w-xl md:max-w-2xl p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Edit Project Settings</DialogTitle>
                    <DialogDescription>
                        Update the fundamental details of {project.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 md:gap-6 py-4 max-h-[70vh] overflow-y-auto px-1 sm:px-2">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-proj-name">Project Name</Label>
                        <Input id="edit-proj-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-proj-desc">Description</Label>
                        <Input id="edit-proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(val) => setStatus(val as typeof status)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Project Type</Label>
                            <Select value={projectType} onValueChange={(val) => setProjectType(val as typeof projectType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="e-commerce">E-Commerce</SelectItem>
                                    <SelectItem value="webpage">Webpage</SelectItem>
                                    <SelectItem value="web-app">Web App</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(val) => setPriority(val as typeof priority)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-proj-start">Start Date</Label>
                            <Input id="edit-proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-proj-deadline">Deadline</Label>
                            <Input id="edit-proj-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-proj-budget">Quotation (₹)</Label>
                            <Input id="edit-proj-budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-proj-progress">Progress (%)</Label>
                            <Input id="edit-proj-progress" type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3 mt-2">
                        <div className="space-y-0.5">
                            <Label>Annual Maintenance</Label>
                            <p className="text-xs text-muted-foreground">Charge ₹450/year from start date</p>
                        </div>
                        <Switch
                            checked={maintenanceEnabled}
                            onCheckedChange={setMaintenanceEnabled}
                        />
                    </div>
                </div>
                <DialogFooter className="flex sm:justify-between items-center w-full">
                    <Button variant="destructive" size="icon" onClick={handleDeleteProject} disabled={isLoading} className="mr-auto" title="Delete Project">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSaveProject} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
