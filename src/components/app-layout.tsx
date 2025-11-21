
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { HistorySidebar } from '@/components/history-sidebar';
import { ExpanderView } from '@/components/expander-view';
import { useHistory } from '@/hooks/use-history';
import type { HistoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { processTextAction, analyzeToneAction, summarizeDocumentAction } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from '@/components/user-nav';
import { ModelSelector } from '@/components/model-selector';
import { useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { UpgradeModal } from './upgrade-modal';
import { ModelProvider } from '@/hooks/use-model';
import { type AnalyzeToneOutput } from '@/ai/flows/analyze-tone';
import { type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';

function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  
  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-sidebar backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-white/90 dark:hover:bg-gray-700/70 transition-all duration-200 shadow-sm"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </motion.button>
      </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ModelSelector />
          <UserNav user={user} onSignOut={signOut} />
        </div>
    </header>
  )
}

export function AppLayout() {
  const { history, isLoaded, addHistoryItem, removeHistoryItem, removeHistoryItems, clearHistory } = useHistory();
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-grow p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }
  
  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
  };
  
  const handleGenericAction = async (action: () => Promise<any>) => {
    try {
      const result = await action();

      if (result.success && result.data) {
          return result.data;
      } else {
          let errorMessage = "An unknown error occurred.";
          if (typeof result.error === 'string') {
              errorMessage = result.error;
          } else if (result.error) {
              const fieldErrors = Object.values(result.error).flat().join(', ');
              errorMessage = fieldErrors || "Validation failed.";
          }
          throw new Error(errorMessage);
      }
    } catch (error) {
       if (!(error instanceof Error && error.message.includes('Upgrade required'))) {
            toast({
                 title: 'An Unexpected Error Occurred',
                 description: (error instanceof Error) ? error.message : 'Please try again later.',
                 variant: 'destructive',
             });
       }
       throw error;
    }
  }

  return (
    <SidebarProvider>
     <ModelProvider>
      <div className="flex min-h-screen w-full">
        <HistorySidebar
          history={history}
          isLoaded={isLoaded}
          onSelectHistory={handleSelectHistory}
          onRemove={removeHistoryItem}
          onRemoveItems={removeHistoryItems}
          onClear={clearHistory}
          user={user}
          onSignOut={signOut}
        />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 flex flex-col">
            <ExpanderView 
              selectedHistoryItem={selectedHistoryItem}
              onProcessText={async (params) => {
                const data = await handleGenericAction(() => processTextAction(params));
                return data;
              }}
              onAnalyzeTone={async (params) => {
                const data = await handleGenericAction(() => analyzeToneAction(params));
                return data;
              }}
              onSummarizeDocument={async (params) => {
                const data = await handleGenericAction(() => summarizeDocumentAction(params));
                return data;
              }}
              onAddHistoryItem={addHistoryItem}
              plan={user.plan}
            />
          </main>
           <footer className="text-center text-xs text-muted-foreground p-4 mt-auto border-t bg-background/50">
              <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>© {new Date().getFullYear()} ZExpander AI</span>
                <span className="text-right">Disclaimer: AI can make mistakes. Consider checking important information.</span>
              </div>
          </footer>
        </SidebarInset>
      </div>
       </ModelProvider>
    </SidebarProvider>
  );
}
