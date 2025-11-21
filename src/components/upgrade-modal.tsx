
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Clock } from 'lucide-react';
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isFileUploadLimit?: boolean;
}

export function UpgradeModal({ isOpen, onOpenChange, isFileUploadLimit = false }: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/plans');
    onOpenChange(false);
  };
  
  const title = isFileUploadLimit 
    ? "Daily File Upload Limit Reached" 
    : "You've run out of tokens!";

  const description = isFileUploadLimit
    ? "You have used all your file uploads for today. To upload more, please upgrade to a Pro plan or wait until tomorrow."
    : "You have used all your free tokens for this month. To continue expanding sentences, please upgrade to a Pro plan or wait until tomorrow for a reset.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col sm:flex-col sm:space-x-0 gap-2">
           <Button onClick={() => onOpenChange(false)} variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Wait Until Tomorrow
          </Button>
          <Button onClick={handleUpgrade} className="w-full font-bold">
            <Zap className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
