
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CardContent, CardFooter } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TriangleAlert } from 'lucide-react';

export function DangerZoneForm() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Simulated account deletion — clears local data and signs out
      const SESSION_KEY = 'zexpander-session';
      const uid = localStorage.getItem(SESSION_KEY);
      if (uid) {
        localStorage.removeItem(`zexpander-plan-${uid}`);
        localStorage.removeItem('zexpander-history');
      }
      toast({ title: 'Account deleted', description: 'Your account data has been permanently cleared.' });
      await signOut();
    } catch (error: unknown) {
      toast({ title: 'Deletion failed', description: error instanceof Error ? error.message : 'An unknown error occurred.', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Deleting your account will remove all your local data. This action is irreversible.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div>
          <h3 className="font-semibold">Delete Account</h3>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <TriangleAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="mt-2">
                    This will permanently delete your account and remove all your local data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
            </div>
            <AlertDialogFooter className="mt-4 sm:justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </>
  );
}
