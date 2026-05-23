"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Bot, Loader2, Sparkles, Copy, Download, X, Paperclip, UploadCloud,
    FileText, FileJson, FileType, Wand2, Lightbulb, BarChart3, BookOpen,
    MessageSquareQuote, Upload, Check, Zap, Layers, Languages,
    ListChecks, PenLine, Smile, Briefcase, Paintbrush, Flag, Star,
    Target, ThumbsUp, TrendingUp, ShieldAlert, Search, UserCheck,
    Hash, Type, AlignLeft, CornerDownLeft, Plus, Minus, ChevronRight,
    AlertCircle, ExternalLink, Gauge, CheckCircle
} from 'lucide-react';
import { ClipboardPaste } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { UserPlan, HistoryItem, ProcessingMode, AppMode } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import { useModel } from '@/hooks/use-model';
import { type AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import { type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { type AIDetectionOutput } from '@/ai/flows/ai-detection';
import { type PlagiarismOutput } from '@/ai/flows/plagiarism-checker';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ThreeBarLoader } from './ui/loader';
import { generateDocxAction, extractTextFromFileAction } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from './ui/progress';
import { UpgradeModal } from './upgrade-modal';
import { useHistory } from '@/hooks/use-history';
import { motion, AnimatePresence } from 'framer-motion';

// #region Scrollable Tab Bar
const TAB_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #0ea5e9, #6366f1)',
    'linear-gradient(135deg, #f43f5e, #f59e0b)',
];

function pickGradient(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
    }
    return TAB_GRADIENTS[hash % TAB_GRADIENTS.length];
}

function ScrollableTabBar<T extends string>({
    tabs,
    value,
    onValueChange,
    size = 'md',
}: {
    tabs: { value: T; label: string; icon?: React.ElementType }[];
    value: T;
    onValueChange: (v: T) => void;
    size?: 'sm' | 'md';
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Stable gradient per tab value
    const gradients = useMemo(
        () => Object.fromEntries(tabs.map(t => [t.value, pickGradient(t.value)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(() => {
        const container = scrollRef.current;
        const active = activeRef.current;
        if (!container || !active) return;
        const containerWidth = container.offsetWidth;
        const activeLeft = active.offsetLeft;
        const activeWidth = active.offsetWidth;
        const targetScrollLeft = activeLeft - containerWidth / 2 + activeWidth / 2;
        container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    }, [value]);

    const isSmall = size === 'sm';

    return (
        <div
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {tabs.map((tab) => {
                const isActive = tab.value === value;
                const Icon = tab.icon;
                const gradient = gradients[tab.value];
                return (
                    <button
                        key={tab.value}
                        ref={isActive ? activeRef : undefined}
                        onClick={() => onValueChange(tab.value)}
                        className={cn(
                            'flex items-center gap-1.5 font-medium whitespace-nowrap transition-all duration-300 select-none flex-shrink-0',
                            isSmall
                                ? 'px-3.5 py-1.5 text-xs rounded-full'
                                : 'px-4 py-2 text-sm rounded-full',
                            isActive
                                ? 'text-white shadow-lg shadow-black/20 scale-[1.04]'
                                : 'text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted/80'
                        )}
                        style={isActive ? { background: gradient } : undefined}
                    >
                        {Icon && (
                            <Icon className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                        )}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
// #endregion

// #region Slash Commands
const slashCommands = [
    { command: '/translate to Spanish', description: 'Translate the text to Spanish', icon: Languages },
    { command: '/summarize in 5 bullet points', description: 'Summarize as five bullet points', icon: ListChecks },
    { command: '/write a poem about', description: 'Write a poem about the text', icon: PenLine },
    { command: '/explain this to a 5-year-old', description: 'Explain in simple terms', icon: Smile },
    { command: '/make it more professional', description: 'Professional tone rewrite', icon: Briefcase },
    { command: '/make it more creative', description: 'Creative and engaging rewrite', icon: Paintbrush },
    { command: '/fix grammar and spelling', description: 'Correct grammatical errors', icon: Flag },
    { command: '/make it more concise', description: 'Shorten while preserving meaning', icon: Minus },
    { command: '/expand with examples', description: 'Add relevant examples', icon: Plus },
];

const SlashCommandMenu = ({ onSelect, onClose }: { onSelect: (command: string) => void; onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-full left-0 mb-2 w-full md:w-[340px] bg-background border rounded-xl shadow-xl z-10 overflow-hidden"
    >
        <div className="p-3 bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Quick Commands
            </p>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
            {slashCommands.map((item) => {
                const Icon = item.icon;
                const [firstWord, ...rest] = item.command.split(' ');
                const restOfCommand = rest.join(' ');

                return (
                    <button
                        key={item.command}
                        onClick={() => {
                            onSelect(item.command);
                            onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-accent transition-all duration-200 group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-sm text-primary font-medium">
                                        {firstWord}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {restOfCommand}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    {item.description}
                                </p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>
                );
            })}
        </div>
    </motion.div>
);
// #endregion

// #region Input/Output Components
const InputCard = ({
    sentence,
    setSentence,
    isLoading,
    onFileUpload
}: {
    sentence: string;
    setSentence: (value: string) => void;
    isLoading: boolean;
    onFileUpload: (file: File, setStatus: (status: 'idle' | 'uploading' | 'parsing') => void) => Promise<void>;
}) => {
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
            } catch {
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
            toast({ title: "📋 Pasted from clipboard!" });
        } catch {
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
                        <p className="text-sm font-medium">Uploading...</p>
                    </div>
                );
            case 'parsing':
                return (
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin text-primary" />
                        <p className="text-sm font-medium">Parsing file...</p>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                        <UploadCloud className="w-12 h-12 mb-3 text-muted-foreground/50" />
                        {isDragActive ? (
                            <p className="font-semibold text-primary">Drop the file here...</p>
                        ) : (
                            <>
                                <p className="mb-2 text-sm">
                                    <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs">Supports TXT, PDF, DOC, DOCX</p>
                            </>
                        )}
                    </div>
                );
        }
    }

    const characterCount = sentence.length;
    const wordCount = sentence.trim() ? sentence.trim().split(/\s+/).length : 0;

    return (
        <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
            <CardContent className="p-0 flex-grow flex flex-col">
                <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <Label className="text-sm font-semibold text-foreground">Input Text</Label>
                        </div>
                        <div className="flex items-center gap-1">
                            {sentence ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                        onClick={() => { navigator.clipboard.writeText(sentence); toast({ title: "Copied!" }) }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                        onClick={() => setSentence('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                        onClick={handlePaste}
                                        title="Paste from clipboard"
                                    >
                                        <ClipboardPaste className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                        onClick={() => setIsUploadModalOpen(true)}
                                        title="Upload file"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 relative">
                    <AnimatePresence>
                        {showSlashCommands && (
                            <SlashCommandMenu
                                onSelect={handleSelectCommand}
                                onClose={() => setShowSlashCommands(false)}
                            />
                        )}
                    </AnimatePresence>

                    <Textarea
                        id="input-sentence"
                        placeholder="Type or paste text here... (Type '/' for quick commands)"
                        className="min-h-[300px] resize-none text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-relaxed"
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSlashCommands(false), 200)}
                        disabled={isLoading || isUploading}
                    />
                </div>

                <div className="p-4 border-t bg-muted/5">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span className="font-medium">{characterCount}</span>
                                <span>characters</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Type className="h-3 w-3" />
                                <span className="font-medium">{wordCount}</span>
                                <span>words</span>
                            </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI-Powered
                        </Badge>
                    </div>
                </div>
            </CardContent>

            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Upload File
                        </DialogTitle>
                        <DialogDescription>
                            Upload a document to extract text for processing.
                        </DialogDescription>
                    </DialogHeader>
                    <div
                        {...getRootProps()}
                        className={cn(
                            "mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                            isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                        )}
                    >
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
        { label: "Short", value: 50, icon: Minus },
        { label: "Medium", value: 100, icon: AlignLeft },
        { label: "Long", value: 200, icon: Plus }
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Max words:</Label>
            {options.map(({ label, value: val, icon: Icon }) => (
                <Button
                    key={label}
                    variant={!isCustom && value === val ? 'default' : 'outline'}
                    onClick={() => { onValueChange(val); setIsCustom(false); }}
                    className={cn(
                        "rounded-full h-8 px-4 text-xs gap-1.5 transition-all duration-200",
                        !isCustom && value === val && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg'
                    )}
                >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                </Button>
            ))}
            <Button
                variant={isCustom ? 'default' : 'outline'}
                onClick={() => { onValueChange(undefined); setIsCustom(true); }}
                className={cn(
                    "rounded-full h-8 px-4 text-xs gap-1.5 transition-all duration-200",
                    isCustom && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                )}
            >
                <Target className="h-3 w-3" />
                Custom
            </Button>
            {isCustom && (
                <Input
                    type="number"
                    placeholder="e.g., 150"
                    className="w-24 h-8 rounded-full text-sm"
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
    options: { label: string; value: ProcessingMode; icon: React.ElementType }[];
    value: ProcessingMode;
    onValueChange: (value: ProcessingMode) => void;
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(({ label, value: val, icon: Icon }) => (
                <Button
                    key={label}
                    variant={value === val ? 'default' : 'outline'}
                    onClick={() => onValueChange(val)}
                    className={cn(
                        "rounded-full h-8 px-4 text-xs gap-1.5 transition-all duration-200",
                        value === val && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg'
                    )}
                >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
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
    onHummanize,
    onAIDetection,
    onPlagiarismCheck,
    isCustom, setIsCustom, maxWords, setMaxWords, customMaxWords, setCustomMaxWords,
    selectedMode, setSelectedMode, activeTab, setActiveTab
}: {
    appMode: AppMode;
    isLoading: boolean;
    onProcessText: () => Promise<void>;
    onSummarizeDocument: () => Promise<void>;
    onAnalyzeTone: () => Promise<void>;
    onHummanize: () => Promise<void>;
    onAIDetection: () => Promise<void>;
    onPlagiarismCheck: () => Promise<void>;
    isCustom: boolean;
    setIsCustom: (val: boolean) => void;
    maxWords: number | undefined;
    setMaxWords: (val: number | undefined) => void;
    customMaxWords: string;
    setCustomMaxWords: (val: string) => void;
    selectedMode: ProcessingMode;
    setSelectedMode: (val: ProcessingMode) => void;
    activeTab: "expand" | "summarize" | "rephrase";
    setActiveTab: (val: "expand" | "summarize" | "rephrase") => void;
}) {

    const rephraseOptions = [
        { label: "Fix Grammar", value: "fix-grammar" as ProcessingMode, icon: Flag },
        { label: "Formal", value: "rephrase-formal" as ProcessingMode, icon: Briefcase },
        { label: "Professional", value: "rephrase-professional" as ProcessingMode, icon: Star },
        { label: "Casual", value: "rephrase-casual" as ProcessingMode, icon: Smile },
        { label: "Creative", value: "rephrase-creative" as ProcessingMode, icon: Paintbrush },
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

    const getButtonText = () => {
        if (appMode === 'text-toolkit') {
            if (activeTab === 'expand') return 'Expand Text';
            if (activeTab === 'summarize') return 'Summarize Text';
            if (activeTab === 'rephrase') return 'Rephrase Text';
        }
        if (appMode === 'document-summary') return 'Summarize Document';
        if (appMode === 'tone-analysis') return 'Analyze Tone';
        if (appMode === 'humanizer') return 'Humanize Text';
        if (appMode === 'ai-detection') return 'Detect AI Content';
        if (appMode === 'plagiarism-checker') return 'Check Plagiarism';
        return 'Process';
    };

    const getButtonIcon = () => {
        if (appMode === 'text-toolkit') {
            if (activeTab === 'expand') return <Plus className="h-4 w-4" />;
            if (activeTab === 'summarize') return <ListChecks className="h-4 w-4" />;
            if (activeTab === 'rephrase') return <Wand2 className="h-4 w-4" />;
        }
        if (appMode === 'document-summary') return <BookOpen className="h-4 w-4" />;
        if (appMode === 'tone-analysis') return <BarChart3 className="h-4 w-4" />;
        if (appMode === 'humanizer') return <UserCheck className="h-4 w-4" />;
        if (appMode === 'ai-detection') return <ShieldAlert className="h-4 w-4" />;
        if (appMode === 'plagiarism-checker') return <Search className="h-4 w-4" />;
        return <Sparkles className="h-4 w-4" />;
    };

    const handleMainAction = () => {
        if (appMode === 'text-toolkit') return onProcessText();
        if (appMode === 'document-summary') return onSummarizeDocument();
        if (appMode === 'tone-analysis') return onAnalyzeTone();
        if (appMode === 'humanizer') return onHummanize();
        if (appMode === 'ai-detection') return onAIDetection();
        if (appMode === 'plagiarism-checker') return onPlagiarismCheck();
    };

    const textToolkitTabs: { value: 'expand' | 'summarize' | 'rephrase'; label: string; icon: React.ElementType }[] = [
        { value: 'expand', label: 'Expand', icon: Plus },
        { value: 'summarize', label: 'Summarize', icon: ListChecks },
        { value: 'rephrase', label: 'Rephrase', icon: Wand2 },
    ];

    return (
        <Card className="bg-gradient-to-br from-background to-background/80 rounded-2xl shadow-lg border-border/50 mt-6">
            <CardContent className="p-5">
                {appMode === 'text-toolkit' ? (
                    <div className="space-y-5">
                        <ScrollableTabBar<'expand' | 'summarize' | 'rephrase'>
                            tabs={textToolkitTabs}
                            value={activeTab}
                            onValueChange={(v) => {
                                setActiveTab(v);
                                if (v === 'expand') setSelectedMode('expand');
                                if (v === 'summarize') setSelectedMode('summarize');
                                if (v === 'rephrase') setSelectedMode('fix-grammar');
                            }}
                            size="sm"
                        />

                        <div className="mt-5 min-h-[60px]">
                            {renderModeOptions()}
                        </div>

                        <Button
                            onClick={handleMainAction}
                            disabled={isLoading}
                            size="lg"
                            className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-11 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                getButtonIcon()
                            )}
                            {getButtonText()}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Button
                            onClick={handleMainAction}
                            disabled={isLoading}
                            size="lg"
                            className="w-full md:w-auto min-w-[200px] font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-11 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                getButtonIcon()
                            )}
                            {getButtonText()}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center flex items-center gap-1">
                            <CornerDownLeft className="h-3 w-3" />
                            Tip: Type '/' for custom AI instructions
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function OutputView({
    appMode,
    isLoading,
    textToolkitOutput,
    documentSummaryOutput,
    toneAnalysisOutput,
    aiDetectionOutput,
    plagiarismOutput,
    clearTextToolkitOutput,
    clearDocumentSummaryOutput,
    clearToneAnalysisOutput,
    clearAIDetectionOutput,
    clearPlagiarismOutput,
    onDownload,
    onHummanize
}: {
    appMode: AppMode;
    isLoading: boolean;
    textToolkitOutput: string;
    documentSummaryOutput: SummarizeDocumentOutput | null;
    toneAnalysisOutput: AnalyzeToneOutput | null;
    aiDetectionOutput: AIDetectionOutput | null;
    plagiarismOutput: PlagiarismOutput | null;
    clearTextToolkitOutput: () => void;
    clearDocumentSummaryOutput: () => void;
    clearToneAnalysisOutput: () => void;
    clearAIDetectionOutput: () => void;
    clearPlagiarismOutput: () => void;
    onDownload: (format: 'txt' | 'pdf' | 'docx', content: string) => Promise<void>;
    onHummanize: () => Promise<void>;
}) {
    const { toast } = useToast();

    const handleDownload = async (format: 'txt' | 'pdf' | 'docx', content: string) => {
        if (!content) return;
        await onDownload(format, content);
    };

    if (isLoading) {
        return (
            <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                <CardContent className="p-6 h-full flex items-center justify-center">
                    <div className="text-center">
                        <ThreeBarLoader />
                        <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                            AI is thinking...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (appMode === 'text-toolkit' || appMode === 'humanizer') {
        if (!textToolkitOutput) {
            return (
                <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">Results will appear here</p>
                            <p className="text-xs mt-1">Enter text and click process to get started</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex-grow flex flex-col">
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <Label className="text-sm font-semibold text-foreground">
                                    {appMode === 'humanizer' ? 'Humanized Output' : 'AI Output'}
                                </Label>
                                <Badge variant="secondary" className="text-[10px] bg-primary/10 gap-1">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Generated
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                    onClick={() => { navigator.clipboard.writeText(textToolkitOutput); toast({ title: "Copied!" }) }}
                                    disabled={!textToolkitOutput}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                {appMode !== 'humanizer' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                        onClick={onHummanize}
                                        title="Humanize"
                                        disabled={!textToolkitOutput || isLoading}
                                    >
                                        <PenLine className="h-4 w-4" />
                                    </Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" disabled={!textToolkitOutput}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleDownload('txt', textToolkitOutput)}>
                                            <FileText className="mr-2 h-4 w-4" /> TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('pdf', textToolkitOutput)}>
                                            <FileJson className="mr-2 h-4 w-4" /> PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('docx', textToolkitOutput)}>
                                            <FileType className="mr-2 h-4 w-4" /> DOCX
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                    onClick={clearTextToolkitOutput}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="max-h-[300px] whitespace-pre-wrap text-foreground/90 leading-relaxed overflow-y-scroll">
                                    {textToolkitOutput}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-muted/5">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        <span className="font-medium">{textToolkitOutput.length}</span>
                                        <span>characters</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Type className="h-3 w-3" />
                                        <span className="font-medium">{textToolkitOutput.trim() ? textToolkitOutput.trim().split(/\s+/).length : 0}</span>
                                        <span>words</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>{appMode === 'humanizer' ? 'Human Verified' : 'AI Enhanced'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (appMode === 'ai-detection') {
        if (!aiDetectionOutput) {
            return (
                <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">AI detection results will appear here</p>
                            <p className="text-xs mt-1">Enter text to check for AI generation</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        const score = aiDetectionOutput.score;
        const { classification, confidence, perplexityScore, burstinessScore, readabilityScore, aiMarkers, writingPatterns } = aiDetectionOutput;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex-grow flex flex-col">
                        {/* ── Header ── */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <ShieldAlert className="h-4 w-4 text-primary" />
                                </div>
                                <Label className="text-sm font-semibold text-foreground">AI Detection Results</Label>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                onClick={clearAIDetectionOutput}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* ── Verdict Hero ── */}
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                {/* Circular score gauge */}
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="relative w-44 h-44 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                                            <circle
                                                cx="88" cy="88" r="78"
                                                stroke="currentColor" strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={490.1}
                                                strokeDashoffset={490.1 * (1 - score / 100)}
                                                strokeLinecap="round"
                                                className={cn(
                                                    "transition-all duration-1000 ease-out",
                                                    score > 69 ? "text-red-500" : score > 30 ? "text-amber-500" : "text-green-500"
                                                )}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black tracking-tighter">{score}%</span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">AI Score</span>
                                        </div>
                                    </div>
                                    {/* Classification badge */}
                                    <Badge className={cn(
                                        "px-5 py-1.5 text-sm font-black border-0 shadow-lg uppercase tracking-wide",
                                        classification === 'ai' ? "bg-red-500 text-white" :
                                        classification === 'mixed' ? "bg-amber-500 text-white" :
                                        "bg-green-500 text-white"
                                    )}>
                                        {classification === 'ai' ? '🤖 AI Generated' :
                                         classification === 'mixed' ? '⚠️ Mixed Content' :
                                         '✅ Human Written'}
                                    </Badge>
                                    {/* Confidence */}
                                    {confidence !== undefined && (
                                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Gauge className="h-3 w-3" />
                                            Confidence: <span className="font-bold text-foreground ml-0.5">{confidence}%</span>
                                        </span>
                                    )}
                                </div>

                                {/* Summary + quick stats */}
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <MessageSquareQuote className="h-12 w-12" />
                                        </div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3" />
                                            Analysis Summary
                                        </h4>
                                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                                            "{aiDetectionOutput.summary}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Sentences</p>
                                            <p className="text-xl font-bold">{aiDetectionOutput.sentences.length}</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">AI Markers</p>
                                            <p className={cn("text-xl font-bold", aiMarkers.length > 0 ? "text-red-500" : "text-green-500")}>
                                                {aiMarkers.length}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Risk</p>
                                            <p className={cn("text-xs font-bold leading-tight mt-0.5", score > 70 ? "text-red-500" : score > 30 ? "text-amber-500" : "text-green-500")}>
                                                {score > 80 ? 'Very High' : score > 50 ? 'High' : score > 20 ? 'Low' : 'Very Low'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            {/* ── Statistical Signals ── */}
                            {(perplexityScore !== undefined || burstinessScore !== undefined || readabilityScore !== undefined) && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        Statistical Signals
                                    </h4>
                                    <div className="grid gap-4">
                                        {perplexityScore !== undefined && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-foreground/70">Perplexity <span className="text-muted-foreground font-normal">(predictability of word choices)</span></span>
                                                    <span className="text-xs font-bold">{perplexityScore}%</span>
                                                </div>
                                                <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all duration-700 ease-out", perplexityScore > 60 ? 'bg-red-500' : perplexityScore > 35 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${perplexityScore}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                                                    <span>Human (unpredictable)</span><span>AI (predictable)</span>
                                                </div>
                                            </div>
                                        )}
                                        {burstinessScore !== undefined && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-foreground/70">Burstiness <span className="text-muted-foreground font-normal">(sentence length variety)</span></span>
                                                    <span className="text-xs font-bold">{burstinessScore}%</span>
                                                </div>
                                                <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all duration-700 ease-out", burstinessScore < 35 ? 'bg-red-500' : burstinessScore < 60 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${burstinessScore}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                                                    <span>AI-like (monotone)</span><span>Human (varied)</span>
                                                </div>
                                            </div>
                                        )}
                                        {readabilityScore !== undefined && (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-foreground/70">Readability <span className="text-muted-foreground font-normal">(Flesch-Kincaid estimate)</span></span>
                                                    <span className="text-xs font-bold">{readabilityScore}%</span>
                                                </div>
                                                <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${readabilityScore}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                                                    <span>Complex</span><span>Simple</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── AI Markers ── */}
                            {aiMarkers.length > 0 && (
                                <>
                                    <Separator className="bg-border/50" />
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            AI Markers Detected
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {aiMarkers.map((marker, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 font-medium px-2.5 py-0.5 rounded-full">
                                                    {marker}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Writing Patterns ── */}
                            {writingPatterns.length > 0 && (
                                <>
                                    <Separator className="bg-border/50" />
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <Type className="h-4 w-4 text-primary" />
                                            Writing Pattern Analysis
                                        </h4>
                                        <div className="grid sm:grid-cols-2 gap-2">
                                            {writingPatterns.map((pattern, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "flex items-start gap-2.5 p-3 rounded-xl border transition-all",
                                                        pattern.present ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                                                        pattern.present ? "bg-red-500/20" : "bg-green-500/20"
                                                    )}>
                                                        {pattern.present
                                                            ? <X className="h-2.5 w-2.5 text-red-500" />
                                                            : <Check className="h-2.5 w-2.5 text-green-500" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn("text-[11px] font-bold leading-tight", pattern.present ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                                                            {pattern.name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                                            {pattern.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator className="bg-border/50" />

                            {/* ── Sentence Breakdown ── */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Gauge className="h-4 w-4 text-primary" />
                                        Sentence Breakdown
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        {aiDetectionOutput.sentences.length} sentences analyzed
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {aiDetectionOutput.sentences.map((s: { text: string; score: number; flags?: string[] }, i: number) => (
                                        <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 group hover:border-primary/30 hover:bg-muted/40 transition-all duration-200">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <p className="text-sm text-foreground/90 leading-relaxed flex-1 font-medium italic">
                                                    "{s.text}"
                                                </p>
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full border-0 shadow-sm",
                                                    s.score > 70 ? "bg-red-500 text-white" :
                                                        s.score > 30 ? "bg-amber-500 text-white" :
                                                            "bg-green-500 text-white"
                                                )}>
                                                    {s.score}% AI
                                                </Badge>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                    <span>Human</span>
                                                    <span>AI</span>
                                                </div>
                                                <Progress value={s.score} className={cn(
                                                    "h-1.5 bg-muted/50",
                                                    s.score > 70 ? "[&>div]:bg-red-500" :
                                                        s.score > 30 ? "[&>div]:bg-amber-500" :
                                                            "[&>div]:bg-green-500"
                                                )} />
                                            </div>
                                            {s.flags && s.flags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                    {s.flags.map((flag: string, fi: number) => (
                                                        <span key={fi} className="text-[9px] font-medium bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                                                            {flag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (appMode === 'plagiarism-checker') {
        if (!plagiarismOutput) {
            return (
                <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">Plagiarism results will appear here</p>
                            <p className="text-xs mt-1">Enter text to check for plagiarism</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }
        const score = plagiarismOutput.score;
        const { riskLevel, originalityScore, confidence, wordCount, uniquePhraseRatio, citationCount, writingStyleConsistency, suspiciousPhrases, contentCategories, recommendations } = plagiarismOutput;

        const riskColors: Record<string, string> = {
            none: 'bg-green-500',
            low: 'bg-emerald-400',
            moderate: 'bg-amber-500',
            high: 'bg-orange-500',
            critical: 'bg-red-500',
        };
        const riskColor = riskColors[riskLevel ?? 'none'] ?? 'bg-green-500';
        const matchTypeColors: Record<string, string> = {
            exact: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
            paraphrase: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
            structural: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
            citation: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
        const likelihoodColors: Record<string, string> = {
            high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            low: 'bg-muted text-muted-foreground border-border/40',
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex-grow flex flex-col">
                        {/* ── Header ── */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <Search className="h-4 w-4 text-primary" />
                                </div>
                                <Label className="text-sm font-semibold text-foreground">Originality Report</Label>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                onClick={clearPlagiarismOutput}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* ── Dual Score Hero ── */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Similarity score ring */}
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="relative w-40 h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/20" />
                                            <circle
                                                cx="80" cy="80" r="68"
                                                stroke="currentColor" strokeWidth="12"
                                                fill="transparent"
                                                strokeDasharray={427.3}
                                                strokeDashoffset={427.3 * (1 - score / 100)}
                                                strokeLinecap="round"
                                                className={cn(
                                                    "transition-all duration-1000 ease-out",
                                                    score > 40 ? "text-red-500" : score > 20 ? "text-amber-500" : "text-green-500"
                                                )}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black tracking-tighter">{score}%</span>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Similarity</span>
                                        </div>
                                    </div>
                                    {/* Risk badge */}
                                    <Badge className={cn("px-5 py-1.5 text-sm font-black border-0 shadow-lg uppercase tracking-wide text-white", riskColor)}>
                                        {riskLevel === 'none' ? '✅ No Risk' :
                                         riskLevel === 'low' ? '🔵 Low Risk' :
                                         riskLevel === 'moderate' ? '⚠️ Moderate Risk' :
                                         riskLevel === 'high' ? '🔴 High Risk' :
                                         '🚨 Critical'}
                                    </Badge>
                                    {confidence !== undefined && (
                                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Gauge className="h-3 w-3" />
                                            Confidence: <span className="font-bold text-foreground ml-0.5">{confidence}%</span>
                                        </span>
                                    )}
                                </div>

                                {/* Originality ring + stats */}
                                <div className="space-y-4">
                                    {/* Originality ring */}
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
                                                <circle
                                                    cx="32" cy="32" r="26"
                                                    stroke="currentColor" strokeWidth="6"
                                                    fill="transparent"
                                                    strokeDasharray={163.4}
                                                    strokeDashoffset={163.4 * (1 - originalityScore / 100)}
                                                    strokeLinecap="round"
                                                    className="text-green-500 transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[11px] font-black text-green-500">{originalityScore}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Originality Score</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {originalityScore >= 80 ? 'Content is highly original.' :
                                                 originalityScore >= 60 ? 'Mostly original with some similarities.' :
                                                 'Significant borrowed content detected.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick stats */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Sources</p>
                                            <p className={cn("text-xl font-bold", plagiarismOutput.matches.length > 0 ? "text-red-500" : "text-green-500")}>
                                                {plagiarismOutput.matches.length}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Flagged</p>
                                            <p className={cn("text-xl font-bold", suspiciousPhrases.length > 0 ? "text-amber-500" : "text-green-500")}>
                                                {suspiciousPhrases.length}
                                            </p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-center">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Citations</p>
                                            <p className="text-xl font-bold">{citationCount ?? 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            {/* ── Metrics Row ── */}
                            <div className="grid gap-4">
                                {uniquePhraseRatio !== undefined && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-foreground/70">Unique Phrase Ratio <span className="text-muted-foreground font-normal">(% of phrases that appear original)</span></span>
                                            <span className="text-xs font-bold">{uniquePhraseRatio}%</span>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-700 ease-out", uniquePhraseRatio >= 80 ? 'bg-green-500' : uniquePhraseRatio >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${uniquePhraseRatio}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                                            <span>Plagiarized</span><span>Original</span>
                                        </div>
                                    </div>
                                )}
                                {writingStyleConsistency !== undefined && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-foreground/70">Style Consistency <span className="text-muted-foreground font-normal">(low = patchwork copy-paste detected)</span></span>
                                            <span className="text-xs font-bold">{writingStyleConsistency}%</span>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all duration-700 ease-out", writingStyleConsistency >= 70 ? 'bg-green-500' : writingStyleConsistency >= 45 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${writingStyleConsistency}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase tracking-tight">
                                            <span>Patchwork</span><span>Uniform</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Content categories ── */}
                            {contentCategories.length > 0 && contentCategories[0] !== 'general' && (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topics:</span>
                                    {contentCategories.map((cat, i) => (
                                        <Badge key={i} variant="secondary" className="text-[10px] capitalize px-2.5 py-0.5 rounded-full">
                                            {cat}
                                        </Badge>
                                    ))}
                                    {wordCount !== undefined && wordCount > 0 && (
                                        <span className="ml-auto text-[11px] text-muted-foreground font-medium">
                                            ~{wordCount} words analyzed
                                        </span>
                                    )}
                                </div>
                            )}

                            <Separator className="bg-border/50" />

                            {/* ── Matching Sources ── */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-primary" />
                                    Matching Sources
                                </h4>
                                {plagiarismOutput.matches.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {plagiarismOutput.matches.map((m, i: number) => (
                                            <div key={i} className="p-4 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition-all group">
                                                <div className="flex justify-between items-start gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{m.title}</h5>
                                                        <a href={m.url !== 'unknown' ? m.url : undefined} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block mt-0.5">
                                                            {m.url}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {m.matchType && (
                                                            <Badge variant="outline" className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize", matchTypeColors[m.matchType] ?? 'bg-muted/30 text-muted-foreground border-border/40')}>
                                                                {m.matchType}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border-0 shadow-sm text-white",
                                                            m.score > 70 ? "bg-red-500" : m.score > 40 ? "bg-amber-500" : "bg-emerald-500"
                                                        )}>
                                                            {m.score}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground italic line-clamp-2 bg-background/50 p-2.5 rounded-lg border border-border/30 mt-2">
                                                    "...{m.snippet}..."
                                                </p>
                                                {m.sourceCategory && (
                                                    <div className="mt-2 flex items-center gap-1">
                                                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Source type:</span>
                                                        <span className="text-[9px] font-medium capitalize text-foreground/60">{m.sourceCategory}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center bg-green-500/5 rounded-2xl border border-green-500/20">
                                        <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                                        <p className="text-sm font-bold text-green-600 dark:text-green-400">No Matching Sources Found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Content appears to be original.</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Suspicious Phrases ── */}
                            {suspiciousPhrases.length > 0 && (
                                <>
                                    <Separator className="bg-border/50" />
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            Suspicious Passages
                                        </h4>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {suspiciousPhrases.map((p, i) => (
                                                <div key={i} className={cn("p-3 rounded-xl border", likelihoodColors[p.likelihood] ?? 'bg-muted/20 border-border/40')}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <p className="text-xs italic flex-1 leading-relaxed">"{p.phrase}"</p>
                                                        <Badge variant="outline" className={cn("text-[9px] font-bold rounded-full border flex-shrink-0 capitalize", likelihoodColors[p.likelihood])}>
                                                            {p.likelihood}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-1.5">{p.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator className="bg-border/50" />

                            {/* ── Summary ── */}
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                    <MessageSquareQuote className="h-14 w-14" />
                                </div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Analysis Summary
                                </h5>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {plagiarismOutput.summary}
                                </p>
                            </div>

                            {/* ── Recommendations ── */}
                            {recommendations.length > 0 && (
                                <div className="space-y-2">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                        <Lightbulb className="h-3.5 w-3.5" />
                                        Recommendations
                                    </h5>
                                    <div className="space-y-2">
                                        {recommendations.map((rec, i) => (
                                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-[10px] font-black text-primary">{i + 1}</span>
                                                </div>
                                                <p className="text-xs text-foreground/80 leading-relaxed">{rec}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (appMode === 'document-summary') {
        if (!documentSummaryOutput) {
            return (
                <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">Summary will appear here</p>
                            <p className="text-xs mt-1">Upload a document to get started</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const summaryContent = `Headline: ${documentSummaryOutput.headline}\n\nSummary:\n${documentSummaryOutput.summary}\n\nKey Takeaways:\n${documentSummaryOutput.keyTakeaways.map(t => `- ${t}`).join('\n')}`;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 h-full flex flex-col">
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                </div>
                                <Label className="text-sm font-semibold text-foreground">Document Analysis</Label>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                    onClick={() => { navigator.clipboard.writeText(summaryContent); toast({ title: "Copied!" }) }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleDownload('txt', summaryContent)}>
                                            <FileText className="mr-2 h-4 w-4" /> TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('pdf', summaryContent)}>
                                            <FileJson className="mr-2 h-4 w-4" /> PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('docx', summaryContent)}>
                                            <FileType className="mr-2 h-4 w-4" /> DOCX
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                    onClick={clearDocumentSummaryOutput}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-3">
                                    {documentSummaryOutput.headline}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {documentSummaryOutput.summary}
                                </p>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-primary" />
                                    Key Takeaways
                                </h4>
                                <div className="space-y-3">
                                    {documentSummaryOutput.keyTakeaways.map((item: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all duration-200">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-primary">{i + 1}</span>
                                            </div>
                                            <span className="text-muted-foreground leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (appMode === 'tone-analysis') {
        if (!toneAnalysisOutput) {
            return (
                <Card className="flex flex-col w-full border-border/50 shadow-lg bg-gradient-to-br from-background to-background/80 rounded-2xl min-h-[300px]">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">Tone analysis will appear here</p>
                            <p className="text-xs mt-1">Enter text to analyze its tone and style</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const toneContent = `Overall Tone: ${toneAnalysisOutput.overallTone}\n\nAnalysis:\n${toneAnalysisOutput.toneAnalysis}\n\nSuggestions:\n${toneAnalysisOutput.suggestions.map((s: { suggestion: string; description: string }) => `- ${s.suggestion}: ${s.description}`).join('\n')}`;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="flex flex-col w-full border-primary/20 ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-background to-background/80 rounded-2xl overflow-hidden">
                    <CardContent className="p-0 h-full flex flex-col">
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-b flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <MessageSquareQuote className="h-4 w-4 text-primary" />
                                </div>
                                <Label className="text-sm font-semibold text-foreground">Tone & Style Analysis</Label>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                    onClick={() => { navigator.clipboard.writeText(toneContent); toast({ title: "Copied!" }) }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleDownload('txt', toneContent)}>
                                            <FileText className="mr-2 h-4 w-4" /> TXT
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('pdf', toneContent)}>
                                            <FileJson className="mr-2 h-4 w-4" /> PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDownload('docx', toneContent)}>
                                            <FileType className="mr-2 h-4 w-4" /> DOCX
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                    onClick={clearToneAnalysisOutput}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    Overall Tone
                                </h4>
                                <Badge className="text-base px-4 py-1.5 bg-gradient-to-r from-primary/20 to-purple-600/20 text-foreground border-0 gap-2">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    {toneAnalysisOutput.overallTone}
                                </Badge>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Analysis
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">{toneAnalysisOutput.toneAnalysis}</p>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4 text-primary" />
                                    Suggestions for Improvement
                                </h4>
                                <div className="space-y-3">
                                    {toneAnalysisOutput.suggestions.map((item: { suggestion: string; description: string }, i: number) => (
                                        <div key={i} className="p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all duration-200">
                                            <p className="font-medium text-foreground/90 mb-1 flex items-center gap-2">
                                                <Wand2 className="h-3.5 w-3.5 text-primary" />
                                                {item.suggestion}
                                            </p>
                                            <p className="text-sm text-muted-foreground pl-5">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return null;
}
// #endregion
const APP_MODE_TABS: { value: AppMode; label: string; icon: React.ElementType }[] = [
    { value: 'text-toolkit', label: 'Toolkit', icon: Layers },
    { value: 'humanizer', label: 'Humanizer', icon: UserCheck },
    { value: 'ai-detection', label: 'AI Detect', icon: ShieldAlert },
    { value: 'plagiarism-checker', label: 'Plagiarism', icon: Search },
    { value: 'document-summary', label: 'Summary', icon: BookOpen },
    { value: 'tone-analysis', label: 'Tone', icon: BarChart3 },
];

const ExpanderHeader = ({ appMode, setAppMode, plan, tokensLeft, uploadsLeft }: { appMode: AppMode, setAppMode: (mode: AppMode) => void, plan: UserPlan, tokensLeft: number | string, uploadsLeft: number | string }) => {

    return (
        <div className="p-4 md:px-6 border-b sticky top-0 bg-background/95 backdrop-blur-md z-10 shadow-sm">
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                <div className="w-full xl:w-auto">
                    <ScrollableTabBar<AppMode>
                        tabs={APP_MODE_TABS}
                        value={appMode}
                        onValueChange={setAppMode}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                        <div className="p-0.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">Plan: {plan}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium">{tokensLeft}</span>
                            <span className="text-muted-foreground">tokens</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                            <Upload className="w-3.5 h-3.5 text-primary" />
                            <span className="font-medium">{uploadsLeft}</span>
                            <span className="text-muted-foreground">uploads</span>
                        </div>
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
    onHummanize,
    onAIDetection,
    onPlagiarismCheck,
    plan,
}: {
    selectedHistoryItem: HistoryItem | null;
    onProcessText: (params: { text: string; mode: ProcessingMode; model: string; maxWords?: number, customPrompt?: string }) => Promise<string | undefined>;
    onAnalyzeTone: (params: { text: string; model: string; }) => Promise<AnalyzeToneOutput | undefined>;
    onSummarizeDocument: (params: { text: string; model: string; }) => Promise<SummarizeDocumentOutput | undefined>;
    onHummanize: (params: { text: string; model: string; style?: string; maxWords?: number }) => Promise<string | undefined>;
    onAIDetection: (params: { text: string; model: string; }) => Promise<AIDetectionOutput | undefined>;
    onPlagiarismCheck: (params: { text: string; model: string; }) => Promise<PlagiarismOutput | undefined>;
    onAddHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    plan: UserPlan;
}) {
    const [appMode, setAppMode] = useState<AppMode>('text-toolkit');
    const [isLoading, setIsLoading] = useState(false);
    const [inputSentence, setInputSentence] = useState('');
    const [textToolkitOutput, setTextToolkitOutput] = useState('');
    const [documentSummaryOutput, setDocumentSummaryOutput] = useState<SummarizeDocumentOutput | null>(null);
    const [toneAnalysisOutput, setToneAnalysisOutput] = useState<AnalyzeToneOutput | null>(null);
    const [aiDetectionOutput, setAIDetectionOutput] = useState<AIDetectionOutput | null>(null);
    const [plagiarismOutput, setPlagiarismOutput] = useState<PlagiarismOutput | null>(null);

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
        if (selectedHistoryItem) {
            setInputSentence(selectedHistoryItem.original);
            setAppMode(selectedHistoryItem.type);

            // Clear all outputs first
            setTextToolkitOutput('');
            setDocumentSummaryOutput(null);
            setToneAnalysisOutput(null);

            if (selectedHistoryItem.type === 'text-toolkit' || selectedHistoryItem.type === 'humanizer') {
                setTextToolkitOutput(selectedHistoryItem.expanded);
            } else if (selectedHistoryItem.type === 'document-summary') {
                try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setDocumentSummaryOutput(parsed);
                } catch (e) { console.error("Failed to parse summary history", e) }
            } else if (selectedHistoryItem.type === 'tone-analysis') {
                try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setToneAnalysisOutput(parsed);
                } catch (e) { console.error("Failed to parse tone history", e) }
            } else if (selectedHistoryItem.type === 'ai-detection') {
                try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setAIDetectionOutput(parsed);
                } catch (e) { console.error("Failed to parse AI detection history", e) }
            } else if (selectedHistoryItem.type === 'plagiarism-checker') {
                try {
                    const parsed = JSON.parse(selectedHistoryItem.expanded);
                    setPlagiarismOutput(parsed);
                } catch (e) { console.error("Failed to parse plagiarism history", e) }
            }
        }
    }, [selectedHistoryItem]);

    const handleAction = async (action: () => Promise<void>, feature: 'expansions' | 'fileUploads', cost: number = 1) => {
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
        } catch (error) {
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
            setStatus('uploading');
            const reader = new FileReader();

            const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
                reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                reader.onerror = () => reject(new Error("Failed to read file"));
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
        }, 'fileUploads');
    };

    const handleHummanize = async () => {
        const textToHumanize = appMode === 'humanizer' ? inputSentence : textToolkitOutput;
        if (!textToHumanize) {
            toast({ title: 'Nothing to humanize', description: 'Enter or generate some text first.', variant: 'destructive' });
            return;
        }

        await handleAction(async () => {
            const result = await onHummanize({ text: textToHumanize, model: selectedModel.id, style: 'academic' });
            if (result) {
                setTextToolkitOutput(result);
                setAppMode('humanizer');
                addHistoryItem({ original: textToHumanize, expanded: result, model: selectedModel.id, type: 'humanizer' });
            }
        }, 'expansions', textToHumanize.length);
    };

    const handleAIDetection = () => handleAction(async () => {
        const result = await onAIDetection({ text: inputSentence, model: selectedModel.id });
        if (result) {
            setAIDetectionOutput(result);
            addHistoryItem({ original: inputSentence, expanded: JSON.stringify(result), model: selectedModel.id, type: 'ai-detection' });
        }
    }, 'expansions', inputSentence.length);

    const handlePlagiarismCheck = () => handleAction(async () => {
        const result = await onPlagiarismCheck({ text: inputSentence, model: selectedModel.id });
        if (result) {
            setPlagiarismOutput(result);
            addHistoryItem({ original: inputSentence, expanded: JSON.stringify(result), model: selectedModel.id, type: 'plagiarism-checker' });
        }
    }, 'expansions', inputSentence.length);

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
                <div className="max-w-5xl mx-auto">
                    <div className={cn("grid gap-6", appMode === 'text-toolkit' ? 'lg:grid-cols-2' : 'grid-cols-1')}>
                        <InputCard sentence={inputSentence} setSentence={setInputSentence} isLoading={isLoading} onFileUpload={handleFileUpload} />

                        <OutputView
                            appMode={appMode}
                            isLoading={isLoading}
                            textToolkitOutput={textToolkitOutput}
                            documentSummaryOutput={documentSummaryOutput}
                            toneAnalysisOutput={toneAnalysisOutput}
                            aiDetectionOutput={aiDetectionOutput}
                            plagiarismOutput={plagiarismOutput}
                            clearTextToolkitOutput={() => setTextToolkitOutput('')}
                            clearDocumentSummaryOutput={() => setDocumentSummaryOutput(null)}
                            clearToneAnalysisOutput={() => setToneAnalysisOutput(null)}
                            clearAIDetectionOutput={() => setAIDetectionOutput(null)}
                            clearPlagiarismOutput={() => setPlagiarismOutput(null)}
                            onDownload={handleDownload}
                            onHummanize={handleHummanize}
                        />
                    </div>

                    <ControlsView
                        appMode={appMode}
                        isLoading={isLoading}
                        onProcessText={handleProcessText}
                        onSummarizeDocument={handleSummarizeDocument}
                        onAnalyzeTone={handleAnalyzeTone}
                        onHummanize={handleHummanize}
                        onAIDetection={handleAIDetection}
                        onPlagiarismCheck={handlePlagiarismCheck}
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