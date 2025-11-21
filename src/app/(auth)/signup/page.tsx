
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571
	l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
}

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { signInDemo } = useAuth();

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    let strength = { score: (score / 6) * 100, label: 'Weak', color: 'bg-blue-200' };
    if (score > 2) strength = { score: (score / 6) * 100, label: 'Medium', color: 'bg-blue-400' };
    if (score > 4) strength = { score: (score / 6) * 100, label: 'Strong', color: 'bg-blue-600' };
    
    return strength;
  }, [password]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        toast({
            title: "Passwords do not match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: fullName });
      }
      router.push("/expand");
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push('/expand');
    } catch (error: any) {
        toast({
            title: "Google Sign-up failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setGoogleLoading(false);
    }
  }

  const handleDemoSignUp = async () => {
    setDemoLoading(true);
    try {
      await signInDemo();
      router.push("/expand");
    } catch (error: any) {
       toast({
        title: "Demo sign-up failed",
        description: "Could not sign in as demo user.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="fullName">Full Name</Label>
             <User className="absolute left-3 top-9 h-5 w-5 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading || googleLoading || demoLoading}
              className="pl-10"
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="email">Email</Label>
            <Mail className="absolute left-3 top-9 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || googleLoading || demoLoading}
              className="pl-10"
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="password">Password</Label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || googleLoading || demoLoading}
              className="pl-10"
              placeholder="Enter your password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {password.length > 0 && (
             <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-medium">Password strength</span>
                    <span className={cn("font-semibold", 
                        passwordStrength.label === 'Weak' && 'text-blue-500',
                        passwordStrength.label === 'Medium' && 'text-blue-500',
                        passwordStrength.label === 'Strong' && 'text-blue-500',
                    )}>{passwordStrength.label}</span>
                </div>
                <Progress value={passwordStrength.score} className={cn("h-2", passwordStrength.color)} />
             </div>
          )}
           <div className="space-y-2 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || googleLoading || demoLoading}
              className="pl-10"
              placeholder="Confirm your password"
            />
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              disabled={loading || googleLoading || demoLoading}
            />
            <Label htmlFor="terms" className="text-sm font-light">
              I agree to the{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms and Conditions
              </Link>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading || googleLoading || demoLoading || !agreedToTerms}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
      
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
            Or continue with
            </span>
        </div>
      </div>

       <CardFooter className="flex flex-col gap-2">
         <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={loading || googleLoading || demoLoading}>
            {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
            Sign up with Google
        </Button>
        <Button variant="outline" className="w-full" onClick={handleDemoSignUp} disabled={loading || googleLoading || demoLoading}>
          {demoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue as Demo User' }
        </Button>
      </CardFooter>

      <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
    </Card>
  );
}
