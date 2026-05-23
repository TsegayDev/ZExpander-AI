"use client";

import * as React from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/icons';
import { Trash2, History, X, Search, TriangleAlert, Copy, Sparkles, Clock, Filter, Pin, ChevronDown, ShieldAlert, UserCheck, BookOpen } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserNav } from './user-nav';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchVisible, setIsSearchVisible] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'all' | 'text-toolkit' | 'document-summary' | 'tone-analysis' | 'ai-detection' | 'humanizer' | 'plagiarism-checker'>('all');
  const [pinnedItems, setPinnedItems] = React.useState<string[]>([]);
  const { toast } = useToast();

  const filteredHistory = React.useMemo(() => {
    let filtered = history;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.expanded.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Sort pinned items to the top
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedItems.includes(a.id);
      const bPinned = pinnedItems.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [history, searchQuery, filterType, pinnedItems]);

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
      // Remove from pinned if it was pinned
      setPinnedItems(prev => prev.filter(id => id !== itemToDelete));
    }
  }

  const handleClear = () => {
    if (searchQuery) {
      const idsToDelete = filteredHistory.map(item => item.id);
      onRemoveItems(idsToDelete);
      // Remove from pinned
      setPinnedItems(prev => prev.filter(id => !idsToDelete.includes(id)));
    } else {
      onClear();
      setPinnedItems([]);
    }
    setIsClearAllOpen(false);
  }

  const handlePinToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
    toast({
      title: pinnedItems.includes(id) ? 'Unpinned' : 'Pinned to top',
      duration: 1500
    });
  }

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: '✨ Copied to clipboard!', duration: 1500 });
  }

  const clearDialogDescription = searchQuery
    ? `This will permanently delete the ${filteredHistory.length} items matching your search.`
    : "This action cannot be undone. This will permanently delete your entire expansion history.";

  const getHistoryItemPreview = (item: HistoryItem) => {
    if (item.type === 'document-summary') {
      try {
        const data = JSON.parse(item.expanded);
        return data.summary || "Summary preview...";
      } catch { return "Summary result"; }
    }
    if (item.type === 'tone-analysis') {
      try {
        const data = JSON.parse(item.expanded);
        return data.toneAnalysis || "Tone analysis preview...";
      } catch { return "Tone analysis result"; }
    }
    if (item.type === 'ai-detection') {
      try {
        const data = JSON.parse(item.expanded);
        return `AI Score: ${data.score}% - ${data.summary}`;
      } catch { return "AI Detection result"; }
    }
    if (item.type === 'plagiarism-checker') {
      try {
        const data = JSON.parse(item.expanded);
        return `Similarity: ${data.score}% - ${data.summary}`;
      } catch { return "Plagiarism result"; }
    }
    return item.expanded;
  }

  const getTypeBadge = (type: HistoryItem['type']) => {
    switch (type) {
      case 'document-summary':
        return <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">Summary</Badge>;
      case 'tone-analysis':
        return <Badge variant="secondary" className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0">Tone</Badge>;
      case 'ai-detection':
        return <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0">AI Detect</Badge>;
      case 'humanizer':
        return <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">Humanizer</Badge>;
      case 'plagiarism-checker':
        return <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-0">Plagiarism</Badge>;
      case 'text-toolkit':
      default:
        return <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">Toolkit</Badge>;
    }
  }

  const getTypeIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'document-summary': return <BookOpen className="h-3 w-3" />;
      case 'tone-analysis': return <Filter className="h-3 w-3" />;
      case 'ai-detection': return <ShieldAlert className="h-3 w-3" />;
      case 'humanizer': return <UserCheck className="h-3 w-3" />;
      case 'plagiarism-checker': return <Search className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  }

  const filterOptions = {
    'all': { label: 'All items', icon: History, description: 'Show all history items' },
    'text-toolkit': { label: 'Toolkit', icon: Sparkles, description: 'Text toolkit items' },
    'humanizer': { label: 'Humanizer', icon: UserCheck, description: 'Humanized texts' },
    'ai-detection': { label: 'AI Detection', icon: ShieldAlert, description: 'AI detection results' },
    'plagiarism-checker': { label: 'Plagiarism', icon: Search, description: 'Plagiarism checks' },
    'document-summary': { label: 'Summaries', icon: BookOpen, description: 'Document summaries' },
    'tone-analysis': { label: 'Tone Analysis', icon: Filter, description: 'Tone analysis results' },
  } as const;

  const currentFilter = filterOptions[filterType];
  const CurrentFilterIcon = currentFilter.icon;

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-to-b from-background via-background to-background/95">
      <SidebarHeader className="p-0">
        <div className="px-5 py-5 border-b border-border/50 bg-gradient-to-r from-background to-background/80">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50" />
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Logo className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  ZExpander
                </h1>
                <p className="text-[11px] text-muted-foreground tracking-wide">
                  AI-Powered Enhancement
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0 flex flex-col">
        <div className="p-3 space-y-3 border-b border-border/50 bg-muted/5">
          {/* Search Row */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isSearchVisible ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search history..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm bg-background/50 border-border/50 focus-visible:ring-primary/30"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <History className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      History • {filteredHistory.length}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:bg-primary/10 transition-all duration-200"
                onClick={handleToggleSearch}
              >
                {isSearchVisible ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
              </Button>

              {history.length > 0 && !isSearchVisible && (
                <AlertDialog open={isClearAllOpen} onOpenChange={setIsClearAllOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200">
                      Clear all
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                        <TriangleAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                          <AlertDialogDescription className="mt-2">
                            {clearDialogDescription}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                      </div>
                    </div>
                    <AlertDialogFooter className="mt-4 gap-2 sm:flex-row sm:justify-end">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">Clear all</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Filter Dropdown - Compact and Elegant */}
          {!isSearchVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg gap-2 bg-background/50 border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
                  >
                    <CurrentFilterIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{currentFilter.label}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {Object.entries(filterOptions).map(([key, option]) => {
                    const Icon = option.icon;
                    const isActive = filterType === key;
                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => setFilterType(key as typeof filterType)}
                        className={cn(
                          "gap-2 cursor-pointer transition-all duration-200",
                          isActive && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                        <span>{option.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="active-filter"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Active filter indicator */}
              {filterType !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="h-7 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear filter
                </Button>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {!isLoaded && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/10 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-3 w-20 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-full bg-muted rounded mb-2" />
                      <div className="h-3 w-3/4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              )}

              {isLoaded && filteredHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 px-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 flex items-center justify-center">
                    {filterType !== 'all' ? (
                      <Filter className="h-8 w-8 text-muted-foreground/40" />
                    ) : (
                      <History className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {filterType !== 'all'
                      ? `No ${currentFilter.label.toLowerCase()} found`
                      : 'No expansions yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {filterType !== 'all'
                      ? `Try changing the filter or create new ${currentFilter.label.toLowerCase()}`
                      : 'Your AI-enhanced texts will appear here'}
                  </p>
                </motion.div>
              ) : (
                <AlertDialog>
                  <AnimatePresence mode="popLayout">
                    {filteredHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group relative"
                      >
                        <div
                          className={cn(
                            "p-3 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                            pinnedItems.includes(item.id)
                              ? "bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20 shadow-sm"
                              : "bg-card/30 border-border/30 hover:border-primary/20 hover:shadow-md hover:bg-card/50"
                          )}
                          onClick={() => onSelectHistory(item)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1 rounded",
                                item.type === 'document-summary' ? "bg-purple-100 dark:bg-purple-900/30" :
                                  item.type === 'tone-analysis' ? "bg-pink-100 dark:bg-pink-900/30" :
                                    "bg-blue-100 dark:bg-blue-900/30"
                              )}>
                                {getTypeIcon(item.type)}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(item.timestamp)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {getTypeBadge(item.type)}
                            </div>
                          </div>

                          <p className="text-sm font-medium line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                            {item.original}
                          </p>

                          <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {getHistoryItemPreview(item)}
                          </p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex items-center gap-0.5 transition-all duration-200 translate-x-1 group-hover:translate-x-0 bg-secondary dark:bg-secondary rounded-[5px]">
                          <button
                            onClick={(e) => handlePinToggle(e, item.id)}
                            className={cn(
                              "p-1.5 rounded-[5px] transition-all duration-200",
                              pinnedItems.includes(item.id)
                                ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                                : "hover:bg-primary/5 text-muted-foreground"
                            )}
                            aria-label={pinnedItems.includes(item.id) ? "Unpin" : "Pin to top"}
                          >
                            <Pin className={cn("h-3.5 w-3.5", pinnedItems.includes(item.id) && "fill-current")} />
                          </button>
                          <button
                            onClick={(e) => handleCopy(e, item.expanded)}
                            className="p-1.5 rounded-[5px] hover:bg-blue-500/10 text-muted-foreground hover:text-blue-700 dark:hover:text-blue-100 transition-all duration-200"
                            aria-label="Copy expanded text"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(item.id);
                              }}
                              className="p-1.5 rounded-[5px] hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                              aria-label="Delete item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <AlertDialogContent>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                        <TriangleAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete history item?</AlertDialogTitle>
                          <AlertDialogDescription className="mt-2">
                            This action cannot be undone. The item will be permanently deleted.
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

      <SidebarFooter className="p-3 border-t border-border/50 bg-muted/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {user && <UserNav user={user} onSignOut={onSignOut} side="top" align="end" triggerVariant="detailed" />}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggler />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}