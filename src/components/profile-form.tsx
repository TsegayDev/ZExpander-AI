
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateUserProfileAction } from "@/app/actions";
import { useEffect } from "react";

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ProfileFormValues & { email: string }>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.displayName || "",
        email: user.email || "",
      });
    }
  }, [user, reset]);


  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const result = await updateUserProfileAction({ fullName: data.fullName });
      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been successfully updated.",
        });
      } else {
        throw new Error(typeof result.error === 'string' ? result.error : "An unknown error occurred");
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} disabled />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </CardFooter>
    </form>
  );
}
