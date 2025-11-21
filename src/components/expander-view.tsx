
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Sparkles, Copy, Download, ClipboardPaste, X, Paperclip, UploadCloud, FileText, FileJson, FileType, Wand2, Lightbulb, BarChart3, BookOpen, MessageSquareQuote, ChevronsUpDown, FileIcon, FileQuestion, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { UserPlan, HistoryItem, ProcessingMode, AppMode, ViewProps, DocumentSummaryViewProps, ToneAnalysisViewProps } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import { generateDocxAction } from '@/app/docx-actions';
import { useModel } from '@/hooks/use-model';
import { type AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import { type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ThreeBarLoader } from './ui/loader';
import { extractTextFromFileAction } from '@/app/file-actions';
import { useAuth } from '@/hooks/use-auth';
import { UpgradeModal } from './upgrade-modal';
import { useHistory } from '@/hooks/use-history';

// #region Slash Commands
const slashCommands = [
    { command: '/translate to Spanish', description: 'Translate the text to Spanish' },
    { command: '/summarize in 5 bullet points', description: 'Summarize as five bullet points' },
    { command: '/write a poem about', description: 'Write a poem about the text' },
    { command: '/explain this to a 5-year-old', description: 'Explain in simple terms' },
];

const SlashCommandMenu = ({ onSelect }: { onSelect: (command: string) => void }) => (
    <div className="absolute bottom-full left-0 mb-2 w-full md:w-[300px] bg-background border rounded-lg shadow-xl z-10 p-2">
        <p className="text-xs text-muted-foreground px-2 pb-1 font-semibold">Popular Commands</p>
        <ul className="space-y-1">
            {slashCommands.map((item) => (
                <li key={item.command}>
                    <button
                        onClick={() => onSelect(item.command)}
                        className="w-full text-left p-2 rounded-md hover:bg-accent text-sm"
                    >
                        <span className="font-medium text-foreground/90">{item.command.split(' ')[0]}</span>
                        <span className="text-muted-foreground ml-2">{item.command.substring(item.command.indexOf(' '))}</span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                </li>
            ))}
        </ul>
    </div>
);
// #endregion

// #region Input/Output Components
const InputCard = ({ sentence, setSentence, isLoading, onFileUpload }: { sentence: string, setSentence: (value: string) => void, isLoading: boolean, onFileUpload: (file: File, setStatus: (status: string) => void) => Promise<void> }) => {
    const { toast } = useToast();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [showSlashCommands, setShowSlashCommands] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing'>('idle');

    useEffect(() => {
        if (sentence.trim() === '/') {
            setShowSlashCommands(true);
        } else {
            setShowSlashCommands(false);
        }
    }, [sentence]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            try {
                await onFileUpload(file, setUploadStatus);
            } catch (error) {
                // Error toast is handled in the parent component
            } finally {
                setUploadStatus('idle');
                setIsUploadModalOpen(false);
            }
        }
    }, [onFileUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
    });

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setSentence(text);
            toast({ title: "Pasted from clipboard!" });
        } catch (err) {
            toast({ title: "Failed to paste", description: "Please check your browser permissions.", variant: 'destructive' });
        }
    };

    const handleSelectCommand = (command: string) => {
        setSentence(command + ' ');
        setShowSlashCommands(false);
    };

    const isUploading = uploadStatus !== 'idle';
    
    const renderUploadContent = () => {
        switch (uploadStatus) {
            case 'uploading':
                return (
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin text-primary" />
                        <p>Uploading...</p>
                    </div>
                );
            case 'parsing':
                return (
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin text-primary" />
                        <p>Parsing file...</p>
                    </div>
                );
            case 'idle':
            default:
                 return (
                     <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                        <UploadCloud className="w-10 h-10 mb-3" />
                        {isDragActive ? <p className="font-bold text-primary">Drop the file here...</p> : <><p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p><p className="text-xs">TXT, PDF, DOCX supported</p></>}
                    </div>
                );
        }
    }

    return (
        <Card className="flex flex-col w-full border-border/80 shadow-sm bg-background/50 backdrop-blur-sm rounded-xl">
            <CardContent className="p-4 flex-grow flex flex-col relative">
                <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="input-sentence" className="text-sm font-medium text-muted-foreground">Your Text</Label>
                    <div className="flex items-center gap-1">
                        {sentence ? (
                            <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(sentence); toast({ title: "Copied!" }) }}><Copy className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSentence('')}><X className="w-4 h-4" /></Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePaste}><ClipboardPaste className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsUploadModalOpen(true)}><Paperclip className="w-4 h-4" /></Button>
                            </>
                        )}
                    </div>
                </div>
                 {showSlashCommands && <SlashCommandMenu onSelect={handleSelectCommand} />}
                <Textarea
                    id="input-sentence"
                    placeholder="Type or paste text here. For custom commands, type / and your instruction."
                    className="flex-grow resize-none text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[150px]"
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSlashCommands(false), 100)}
                    disabled={isLoading || isUploading}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                    <span>{sentence.length} characters</span>
                    <span>{sentence.trim() ? sentence.trim().split(/\s+/).length : 0} words</span>
                </div>
            </CardContent>
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload a file</DialogTitle>
                        <DialogDescription>Drag and drop your file here or click to select a file.</DialogDescription>
                    </DialogHeader>
                    <div {...getRootProps()} className={cn("mt-4 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer", isDragActive ? "border-primary bg-primary/10" : "border-border")}>
                        <input {...getInputProps()} />
                        {renderUploadContent()}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// #endregion

// #region Mode-Specific Components
const WordCountSelector = ({
    value,
    onValueChange,
    customValue,
    onCustomValueChange,
    isCustom,
    setIsCustom
}: {
    value: number | undefined;
    onValueChange: (value: number | undefined) => void;
    customValue: string;
    onCustomValueChange: (value: string) => void;
    isCustom: boolean;
    setIsCustom: (value: boolean) => void;
}) => {
    const options = [
        { label: "Short", value: 50 },
        { label: "Medium", value: 100 },
        { label: "Long", value: 200 }
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium mr-2">Max words:</Label>
            {options.map(({ label, value: val }) => (
                <Button
                    key={label}
                    variant={!isCustom && value === val ? 'default' : 'outline'}
                    onClick={() => { onValueChange(val); setIsCustom(false); }}
                    className={cn("rounded-full h-8 px-4 text-xs sm:text-sm", !isCustom && value === val && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md')}
                >
                    {label}
                </Button>
            ))}
            <Button
                variant={isCustom ? 'default' : 'outline'}
                onClick={() => { onValueChange(undefined); setIsCustom(true); }}
                className={cn("rounded-full h-8 px-4 text-xs sm:text-sm", isCustom && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md')}
            >
                Custom
            </Button>
            {isCustom && (
                <Input
                    type="number"
                    placeholder="e.g. 150"
                    className="w-24 h-8"
                    value={customValue}
                    onChange={(e) => onCustomValueChange(e.target.value)}
                />
            )}
        </div>
    );
};

const ModeSelector = ({
    options,
    value,
    onValueChange,
}: {
    options: { label: string; value: ProcessingMode }[];
    value: ProcessingMode;
    onValueChange: (value: ProcessingMode) => void;
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(({ label, value: val }) => (
                 <Button
                    key={label}
                    variant={value === val ? 'default' : 'outline'}
                    onClick={() => onValueChange(val)}
                    className={cn("rounded-full h-8 px-4 text-xs sm:text-sm", value === val && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md')}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
}

function ControlsView({ 
    appMode,
    isLoading,
    onProcessText,
    onSummarizeDocument,
    onAnalyzeTone,
    isCustom, setIsCustom, maxWords, setMaxWords, customMaxWords, setCustomMaxWords,
    selectedMode, setSelectedMode, activeTab, setActiveTab
} : any) {
    
    const rephraseOptions = [
        { label: "Fix Grammar", value: "fix-grammar" as ProcessingMode },
        { label: "Formal", value: "rephrase-formal" as ProcessingMode },
        { label: "Professional", value: "rephrase-professional" as ProcessingMode },
        { label: "Casual", value: "rephrase-casual" as ProcessingMode },
        { label: "Creative", value: "rephrase-creative" as ProcessingMode },
    ];

    const renderModeOptions = () => {
        switch (activeTab) {
            case 'expand':
            case 'summarize':
                 return (
                    <WordCountSelector 
                        value={maxWords}
                        onValueChange={setMaxWords}
                        customValue={customMaxWords}
                        onCustomValueChange={setCustomMaxWords}
                        isCustom={isCustom}
                        setIsCustom={setIsCustom}
                    />
                );
            case 'rephrase':
                return (
                    <ModeSelector
                        options={rephraseOptions}
                        value={selectedMode}
                        onValueChange={setSelectedMode}
                    />
                );
            default:
                return null;
        }
    };
    
    return (
        <Card className="bg-background/50 backdrop-blur-sm rounded-xl shadow-md my-6">
            <CardContent className="p-4">
                {appMode === 'text-toolkit' ? (
                     <div className="grid md:grid-cols-3 gap-4 items-center">
                         <div className="md:col-span-2">
                            <Tabs value={activeTab} onValueChange={(value) => {
                                const newTab = value as any;
                                setActiveTab(newTab);
                                if (newTab === 'expand') setSelectedMode('expand');
                                if (newTab === 'summarize') setSelectedMode('summarize');
                                if (newTab === 'rephrase') setSelectedMode('fix-grammar');
                            }}>
                                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-4 bg-muted/60">
                                    <TabsTrigger value="expand" className="data-[state=active]:bg-background/80 data-[state=active]:shadow-md">Expand</TabsTrigger>
                                    <TabsTrigger value="summarize" className="data-[state=active]:bg-background/80 data-[state=active]:shadow-md">Summarize</TabsTrigger>
                                    <TabsTrigger value="rephrase" className="data-[state=active]:bg-background/80 data-[state=active]:shadow-md">Rephrase</TabsTrigger>
                                </TabsList>
                                 <div className="min-h-[40px] flex items-center">
                                    {renderModeOptions()}
                                </div>
                            </Tabs>
                         </div>
                         <div className="flex flex-col justify-end">
                            <Button onClick={onProcessText} disabled={isLoading} size="lg" className="font-bold shadow-lg hover:shadow-xl transition-shadow rounded-xl w-full h-12 text-base">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                                Process Text
                            </Button>
                             <p className="text-center text-xs text-muted-foreground mt-2">
                                Tip: use `/` for custom instructions.
                            </p>
                        </div>
                    </div>
                ) : (
                     <div className="flex items-center justify-center">
                        {appMode === 'document-summary' && (
                            <Button onClick={onSummarizeDocument} disabled={isLoading} size="lg" className="font-bold shadow-lg hover:shadow-xl transition-shadow rounded-xl h-12 px-8 text-base w-full md:w-auto">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                Summarize Document
                            </Button>
                        )}
                        {appMode === 'tone-analysis' && (
                            <Button onClick={onAnalyzeTone} disabled={isLoading} size="lg" className="font-bold shadow-lg hover:shadow-xl transition-shadow rounded-xl h-12 px-8 text-base w-full md:w-auto">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BarChart3 className="mr-2 h-5 w-5" />}
                                Analyze Tone & Style
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function OutputView({ 
    appMode,
    isLoading,
    textToolkitOutput,
    documentSummaryOutput,
    toneAnalysisOutput,
    clearTextToolkitOutput,
    clearDocumentSummaryOutput,
    clearToneAnalysisOutput,
    onDownload
}: any) {
    const { toast } = useToast();

    const handleDownload = async (format: 'txt' | 'pdf' | 'docx', content: string) => {
        if (!content) return;
        await onDownload(format, content);
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col w-full border-border/80 shadow-sm bg-background/50 backdrop-blur-sm rounded-xl min-h-[250px]">
                <CardContent className="p-6 h-full flex items-center justify-center">
                    <ThreeBarLoader />
                </CardContent>
            </Card>
        );
    }
    
    if (appMode === 'text-toolkit') {
        if (!textToolkitOutput) return null;
        return (
            <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-lg bg-background/70 backdrop-blur-sm rounded-xl">
                <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="output-sentence" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Bot className="w-4 h-4" /> AI Output
                        </Label>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(textToolkitOutput); toast({ title: "Copied!" }) }} disabled={!textToolkitOutput}><Copy className="w-4 h-4" /></Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!textToolkitOutput}>
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDownload('txt', textToolkitOutput)}><FileText className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('pdf', textToolkitOutput)}><FileJson className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('docx', textToolkitOutput)}><FileType className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {textToolkitOutput && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearTextToolkitOutput}><X className="w-4 h-4" /></Button>}
                        </div>
                    </div>
                    <Textarea
                        id="output-sentence"
                        placeholder="The AI's processed text will appear here..."
                        className="w-full h-full resize-none text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[150px]"
                        value={textToolkitOutput}
                        readOnly
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                        <span>{textToolkitOutput.length} characters</span>
                        <span>{textToolkitOutput.trim() ? textToolkitOutput.trim().split(/\s+/).length : 0} words</span>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (appMode === 'document-summary') {
        if (!documentSummaryOutput) {
            return (
                <Card className="flex flex-col w-full border-border/80 shadow-sm bg-background/50 backdrop-blur-sm rounded-xl min-h-[250px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <BookOpen className="w-10 h-10 mx-auto mb-2"/>
                            <p>Summary will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        
        const summaryContent = `Headline: ${documentSummaryOutput.headline}\n\nSummary:\n${documentSummaryOutput.summary}\n\nKey Takeaways:\n${documentSummaryOutput.keyTakeaways.map(t => `- ${t}`).join('\n')}`;

        return (
            <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-lg bg-background/70 backdrop-blur-sm rounded-xl">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <BookOpen className="w-5 h-5" /> Document Analysis
                        </Label>
                         <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(summaryContent); toast({ title: "Copied!" }) }}><Copy className="w-4 h-4" /></Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDownload('txt', summaryContent)}><FileText className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('pdf', summaryContent)}><FileJson className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('docx', summaryContent)}><FileType className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDocumentSummaryOutput}><X className="w-5 h-5" /></Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6">
                        <div>
                            <h3 className="font-bold text-2xl text-primary mb-2">{documentSummaryOutput.headline}</h3>
                            <p className="text-muted-foreground">{documentSummaryOutput.summary}</p>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold text-foreground mb-3">Key Takeaways</h4>
                            <ul className="space-y-2">
                                {documentSummaryOutput.keyTakeaways.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Lightbulb className="w-5 h-5 text-primary/80 flex-shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (appMode === 'tone-analysis') {
         if (!toneAnalysisOutput) {
            return (
                <Card className="flex flex-col w-full border-border/80 shadow-sm bg-background/50 backdrop-blur-sm rounded-xl min-h-[250px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                         <div className="text-center text-muted-foreground">
                            <MessageSquareQuote className="w-10 h-10 mx-auto mb-2"/>
                            <p>Tone analysis will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const toneContent = `Overall Tone: ${toneAnalysisOutput.overallTone}\n\nAnalysis:\n${toneAnalysisOutput.toneAnalysis}\n\nSuggestions:\n${toneAnalysisOutput.suggestions.map(s => `- ${s.suggestion}: ${s.description}`).join('\n')}`;

        return (
             <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-lg bg-background/70 backdrop-blur-sm rounded-xl">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <MessageSquareQuote className="w-5 h-5" /> Tone & Style Analysis
                        </Label>
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(toneContent); toast({ title: "Copied!" }) }}><Copy className="w-4 h-4" /></Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => handleDownload('txt', toneContent)}><FileText className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('pdf', toneContent)}><FileJson className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDownload('docx', toneContent)}><FileType className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearToneAnalysisOutput}><X className="w-5 h-5" /></Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6">
                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Overall Tone</h4>
                            <Badge variant="secondary" className="text-base px-3 py-1">{toneAnalysisOutput.overallTone}</Badge>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Analysis</h4>
                            <p className="text-muted-foreground">{toneAnalysisOutput.toneAnalysis}</p>
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold text-foreground mb-3">Suggestions</h4>
                            <ul className="space-y-3">
                                {toneAnalysisOutput.suggestions.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Wand2 className="w-5 h-5 text-primary/80 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-foreground/90">{item.suggestion}</p>
                                            <p className="text-muted-foreground">{item.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return null;
}
// #endregion


const ExpanderHeader = ({ appMode, setAppMode, plan, tokensLeft, uploadsLeft }: { appMode: AppMode, setAppMode: (mode: AppMode) => void, plan: UserPlan, tokensLeft: number | string, uploadsLeft: number | string }) => {
    
    return (
        <div className="p-4 md:px-6 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <Tabs value={appMode} onValueChange={(value) => setAppMode(value as AppMode)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/60">
                        <TabsTrigger value="text-toolkit" className="data-[state=active]:bg-background data-[state=active]:shadow-lg">Text Toolkit</TabsTrigger>
                        <TabsTrigger value="document-summary" className="data-[state=active]:bg-background data-[state=active]:shadow-lg">Doc Summary</TabsTrigger>
                        <TabsTrigger value="tone-analysis" className="data-[state=active]:bg-background data-[state=active]:shadow-lg">Tone Analysis</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>{tokensLeft} tokens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-primary" />
                        <span>{uploadsLeft} uploads</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ExpanderView({
    selectedHistoryItem,
    onProcessText,
    onAnalyzeTone,
    onSummarizeDocument,
    onAddHistoryItem,
    plan,
}: {
    selectedHistoryItem: HistoryItem | null;
    onProcessText: (params: { text: string; mode: ProcessingMode; model: string; maxWords?: number, customPrompt?: string }) => Promise<string | undefined>;
    onAnalyzeTone: (params: { text: string; model: string; }) => Promise<AnalyzeToneOutput | undefined>;
    onSummarizeDocument: (params: { text: string; model: string; }) => Promise<SummarizeDocumentOutput | undefined>;
    onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    plan: UserPlan;
}) {
    const [appMode, setAppMode] = useState<AppMode>('text-toolkit');
    const [isLoading, setIsLoading] = useState(false);
    const [inputSentence, setInputSentence] = useState('');
    const [textToolkitOutput, setTextToolkitOutput] = useState('');
    const [documentSummaryOutput, setDocumentSummaryOutput] = useState<SummarizeDocumentOutput | null>(null);
    const [toneAnalysisOutput, setToneAnalysisOutput] = useState<AnalyzeToneOutput | null>(null);
    
    // States for Text Toolkit controls
    const [activeTab, setActiveTab] = useState<"expand" | "summarize" | "rephrase">("expand");
    const [selectedMode, setSelectedMode] = useState<ProcessingMode>("expand");
    const [maxWords, setMaxWords] = useState<number | undefined>(100);
    const [customMaxWords, setCustomMaxWords] = useState<string>("");
    const [isCustom, setIsCustom] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const { toast } = useToast();
    const { selectedModel } = useModel();
    const { canUseFeature, incrementUsage, getRemaining } = useAuth();
    const { addHistoryItem } = useHistory();
    
    useEffect(() => {
        if(selectedHistoryItem) {
            setInputSentence(selectedHistoryItem.original);
            setAppMode(selectedHistoryItem.type);

            // Clear all outputs first
            setTextToolkitOutput('');
            setDocumentSummaryOutput(null);
            setToneAnalysisOutput(null);

            if (selectedHistoryItem.type === 'text-toolkit') {
                 setTextToolkitOutput(selectedHistoryItem.expanded);
            } else if (selectedHistoryItem.type === 'document-summary') {
                try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setDocumentSummaryOutput(parsed);
                } catch (e) { console.error("Failed to parse summary history", e)}
            } else if (selectedHistoryItem.type === 'tone-analysis') {
                 try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setToneAnalysisOutput(parsed);
                } catch (e) { console.error("Failed to parse tone history", e)}
            }
        }
    }, [selectedHistoryItem]);
    
    const handleAction = async (action: () => Promise<any>, feature: 'expansions' | 'fileUploads', cost: number = 1) => {
        if (!inputSentence.trim() && feature !== 'fileUploads') {
            toast({ title: 'Input required', description: 'Please enter some text to process.', variant: 'destructive' });
            return;
        }

        if (!canUseFeature(feature, cost)) {
            setIsUpgradeModalOpen(true);
            return;
        }

        setIsLoading(true);
        try {
            await action();
            await incrementUsage(feature, cost);
        } catch(error) {
            console.error("An error occurred during processing:", error);
            if (!(error instanceof Error && error.message.includes('Upgrade required'))) {
                toast({
                    title: 'An Unexpected Error Occurred',
                    description: (error instanceof Error) ? error.message : 'Please try again later.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleProcessText = () => handleAction(async () => {
        let finalMaxWords: number | undefined = undefined;
        let customPrompt: string | undefined = undefined;
        let mode: ProcessingMode = selectedMode;

        if (inputSentence.startsWith('/')) {
            const firstLine = inputSentence.split('\n')[0];
            customPrompt = firstLine.substring(1).trim();
            mode = 'custom';
        } else if (activeTab === 'expand' || activeTab === 'summarize') {
            finalMaxWords = isCustom ? parseInt(customMaxWords) || undefined : maxWords;
            mode = activeTab;
        }
        
        const result = await onProcessText({ text: inputSentence, mode, model: selectedModel.id, maxWords: finalMaxWords, customPrompt });
        if (result) {
            setTextToolkitOutput(result);
            addHistoryItem({ original: inputSentence, expanded: result, model: selectedModel.id, type: 'text-toolkit' });
        }
    }, 'expansions', inputSentence.length);

    const handleSummarizeDocument = () => handleAction(async () => {
        const result = await onSummarizeDocument({ text: inputSentence, model: selectedModel.id });
        if (result) {
            setDocumentSummaryOutput(result);
            addHistoryItem({ original: inputSentence, expanded: JSON.stringify(result), model: selectedModel.id, type: 'document-summary' });
        }
    }, 'expansions', inputSentence.length);
    
    const handleAnalyzeTone = () => handleAction(async () => {
        const result = await onAnalyzeTone({ text: inputSentence, model: selectedModel.id });
        if (result) {
            setToneAnalysisOutput(result);
            addHistoryItem({ original: inputSentence, expanded: JSON.stringify(result), model: selectedModel.id, type: 'tone-analysis' });
        }
    }, 'expansions', inputSentence.length);

    const handleFileUpload = async (file: File, setStatus: (status: 'idle' | 'uploading' | 'parsing') => void) => {
      await handleAction(async () => {
        try {
            setStatus('uploading');
            const reader = new FileReader();
            
            const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
                reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                reader.onerror = (e) => reject(new Error("Failed to read file"));
                reader.readAsArrayBuffer(file);
            });
            
            const arrayBuffer = await fileReadPromise;
            setStatus('parsing');

            const buffer = Buffer.from(arrayBuffer);
            const base64String = buffer.toString('base64');
            const result = await extractTextFromFileAction({ fileBuffer: base64String, fileType: file.type });

            if (result.success && result.data) {
                setInputSentence(result.data);
                toast({ title: "File content loaded!" });
            } else {
                throw new Error(result.error || "Failed to extract text from file.");
            }
          } catch(e) {
            throw e; // re-throw to be caught by handleAction
          }
      }, 'fileUploads');
    };

    const handleDownload = async (format: 'txt' | 'pdf' | 'docx', content: string) => {
        if (!content) return;
        try {
            if (format === 'txt') {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'processed-text.txt';
                a.click();
                URL.revokeObjectURL(url);
            } else if (format === 'pdf') {
                const doc = new jsPDF();
                const lines = doc.splitTextToSize(content, 180);
                doc.text(lines, 10, 10);
                doc.save('processed-text.pdf');
            } else if (format === 'docx') {
                const result = await generateDocxAction({ htmlString: `<p>${content.replace(/\n/g, '<br/>')}</p>` });
                if (result.success && result.data) {
                    const byteCharacters = atob(result.data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'processed-text.docx';
                    a.click();
                    URL.revokeObjectURL(a.href);
                } else {
                    throw new Error(result.error || "Failed to generate DOCX");
                }
            }
            toast({ title: `Downloaded as .${format}!` });
        } catch (error) {
            toast({ title: 'Download failed', description: (error as Error).message, variant: 'destructive' });
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full">
            <ExpanderHeader 
              appMode={appMode} 
              setAppMode={setAppMode} 
              plan={plan} 
              tokensLeft={getRemaining('expansions')}
              uploadsLeft={getRemaining('fileUploads')}
            />
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className={cn("grid gap-6", appMode === 'text-toolkit' ? 'lg:grid-cols-2' : '')}>
                        <InputCard sentence={inputSentence} setSentence={setInputSentence} isLoading={isLoading} onFileUpload={handleFileUpload}/>
                        
                        {appMode === 'text-toolkit' ? (
                            <OutputView
                                appMode={appMode}
                                isLoading={isLoading}
                                textToolkitOutput={textToolkitOutput}
                                clearTextToolkitOutput={() => setTextToolkitOutput('')}
                                onDownload={handleDownload}
                            />
                        ) : appMode === 'document-summary' ? (
                            <OutputView
                                appMode={appMode}
                                isLoading={isLoading}
                                documentSummaryOutput={documentSummaryOutput}
                                clearDocumentSummaryOutput={() => setDocumentSummaryOutput(null)}
                                onDownload={handleDownload}
                            />
                        ) : ( // tone-analysis
                             <OutputView
                                appMode={appMode}
                                isLoading={isLoading}
                                toneAnalysisOutput={toneAnalysisOutput}
                                clearToneAnalysisOutput={() => setToneAnalysisOutput(null)}
                                onDownload={handleDownload}
                            />
                        )}
                    </div>
                    <ControlsView 
                        appMode={appMode}
                        isLoading={isLoading}
                        onProcessText={handleProcessText}
                        onSummarizeDocument={handleSummarizeDocument}
                        onAnalyzeTone={handleAnalyzeTone}
                        isCustom={isCustom}
                        setIsCustom={setIsCustom}
                        maxWords={maxWords}
                        setMaxWords={setMaxWords}
                        customMaxWords={customMaxWords}
                        setCustomMaxWords={setCustomMaxWords}
                        selectedMode={selectedMode}
                        setSelectedMode={setSelectedMode}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>
            </div>
             <UpgradeModal isOpen={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} />
        </div>
    );
}
