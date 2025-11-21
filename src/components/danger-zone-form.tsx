
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CardContent, CardFooter } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { auth } from "@/lib/firebase";
import { deleteUser } from "firebase/auth";
import { TriangleAlert } from "lucide-react";

export function DangerZoneForm() {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      setIsDeleting(false);
      return;
    }
    
    try {
      await deleteUser(user);
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      await signOut();
    } catch (error: any) {
       toast({
        title: "Deletion failed",
        description: "You may need to sign in again to delete your account. " + error.message,
        variant: "destructive",
      });
       setIsDeleting(false);
    }
  };

  return (
    <>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Deleting your account will remove all your data from our servers. This action is irreversible.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
         <div>
            <h3 className="font-semibold">Delete Account</h3>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
         </div>
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              Delete Account
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
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>
            </div>
            <AlertDialogFooter className="mt-4 sm:justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </>
  );
}
