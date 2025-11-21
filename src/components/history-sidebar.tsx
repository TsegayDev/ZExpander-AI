
"use client";

import * as React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/icons';
import { Trash2, History, X, Search, TriangleAlert, Copy } from 'lucide-react';
import type { HistoryItem, AppUser } from '@/lib/types';
import { ThemeToggler } from '@/components/theme-toggler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UserNav } from './user-nav';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useSidebar } from '@/components/ui/sidebar';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface HistorySidebarProps {
  history: HistoryItem[];
  isLoaded: boolean;
  onSelectHistory: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onRemoveItems: (ids: string[]) => void;
  onClear: () => void;
  user: AppUser | null;
  onSignOut: () => void;
}

export function HistorySidebar({ history, isLoaded, onSelectHistory, onRemove, onRemoveItems, onClear, user, onSignOut }: HistorySidebarProps) {
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = React.useState(false);
  const { toggleSidebar } = useSidebar();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchVisible, setIsSearchVisible] = React.useState(false);
  const { toast } = useToast();

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery) return history;
    return history.filter(item => 
      item.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.expanded.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);


  const handleToggleSearch = () => {
    setIsSearchVisible(prev => !prev);
    if (isSearchVisible) {
        setSearchQuery('');
    }
  }

  const handleDelete = () => {
    if (itemToDelete) {
      onRemove(itemToDelete);
      setItemToDelete(null);
    }
  }

  const handleClear = () => {
    if (searchQuery) {
      const idsToDelete = filteredHistory.map(item => item.id);
      onRemoveItems(idsToDelete);
    } else {
      onClear();
    }
    setIsClearAllOpen(false);
  }

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  }
  
  const clearDialogDescription = searchQuery 
    ? `This will permanently delete the ${filteredHistory.length} items matching your search.`
    : "This action cannot be undone. This will permanently delete your entire expansion history.";

  const getHistoryItemPreview = (item: HistoryItem) => {
    if (item.type === 'document-summary') {
      try {
        const data = JSON.parse(item.expanded);
        return data.summary || "Summary";
      } catch { return "Summary result"; }
    }
    if (item.type === 'tone-analysis') {
      try {
        const data = JSON.parse(item.expanded);
        return data.toneAnalysis || "Tone analysis";
      } catch { return "Tone analysis result"; }
    }
    return item.expanded;
  }
  
  const getTypeBadge = (type: HistoryItem['type']) => {
    switch (type) {
        case 'document-summary': return <Badge variant="secondary" className="text-xs">Summary</Badge>;
        case 'tone-analysis': return <Badge variant="secondary" className="text-xs">Tone</Badge>;
        case 'text-toolkit':
        default:
            return null;
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Logo className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground/90">
                    ZExpander
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Sentence Expansion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 flex flex-col">
            <div className="p-2 border-b">
              <div className="flex items-center justify-between px-2 h-8">
                 <AnimatePresence mode="wait">
                    {isSearchVisible ? (
                         <motion.div
                            key="search"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2 w-full"
                        >
                            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="title"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                        >
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold">
                                Expansion History
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={handleToggleSearch}>
                        {isSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                        <span className="sr-only">{isSearchVisible ? 'Close search' : 'Open search'}</span>
                    </Button>

                  {history.length > 0 && !isSearchVisible && (
                    <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="rounded-sm text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                            Clear
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <div className="sm:flex sm:items-start">
                             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                <TriangleAlert className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="mt-2">
                                        {clearDialogDescription}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </div>
                        </div>
                        <AlertDialogFooter className="mt-4 gap-2 sm:flex-row sm:justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                 </div>
              </div>
            </div>
             <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                        {!isLoaded && (
                            <div className="p-4 space-y-3">
                                <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
                                <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
                                <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
                            </div>
                        )}
                        {isLoaded && history.length === 0 ? (
                            <div className="text-center py-8 px-4">
                            <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No expansions yet
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-1">
                                Your expanded texts will appear here
                            </p>
                            </div>
                        ) : (
                        <AlertDialog>
                                <AnimatePresence>
                                    {filteredHistory.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                            className="group relative"
                                            
                                        >
                                            <div 
                                            className="p-3 bg-background-muted/20 dark:bg-gray-800/30 rounded-xl border border-border/30 hover:bg-accent/50 hover:border-accent transition-all duration-200 cursor-pointer overflow-hidden"
                                            onClick={() => onSelectHistory(item)}
                                            >
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs text-muted-foreground">
                                                    {formatTimestamp(item.timestamp)} • {item.model}
                                                </p>
                                                {getTypeBadge(item.type)}
                                            </div>
                                            <p className="text-sm font-medium line-clamp-1 mb-2">
                                            {item.original}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                            {getHistoryItemPreview(item)}
                                            </p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex items-center gap-1 transition-opacity duration-200">
                                                <button
                                                    onClick={(e) => handleCopy(e, item.expanded)}
                                                    className="p-1 hover:bg-primary/10 rounded-sm"
                                                    aria-label="Copy expanded text"
                                                >
                                                    <Copy className="h-4 w-4 text-primary" />
                                                </button>
                                                <AlertDialogTrigger asChild>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemToDelete(item.id);
                                                    }}
                                                    className="p-1 hover:bg-destructive/10 rounded-sm"
                                                    aria-label="Delete item"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </button>
                                                </AlertDialogTrigger>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <AlertDialogContent>
                                <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                            <TriangleAlert className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription className="mt-2">
                                                This will permanently delete this history item.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                        </div>
                                    </div>
                                    <AlertDialogFooter className="mt-4 gap-2 sm:flex-row sm:justify-end">
                                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </ScrollArea>
             </div>
        </SidebarContent>

        <SidebarFooter className="flex-row items-center gap-2 p-2 border-t">
            <div className="flex-1 min-w-0">
                {user && <UserNav user={user} onSignOut={onSignOut} side="top" align="end" triggerVariant="detailed" />}
            </div>
            <ThemeToggler />
        </SidebarFooter>
    </Sidebar>
  );
}
