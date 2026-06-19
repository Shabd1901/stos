'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function GenerateReportButton() {
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsGenerating(true);

        // Simulate generation delay
        await new Promise(res => setTimeout(res, 2000));

        setIsGenerating(false);
        toast({
            title: 'Report Generated',
            description: 'Your monthly performance report has been compiled successfully.',
        });
    };

    return (
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : 'Generate Monthly Report'}
        </Button>
    );
}
