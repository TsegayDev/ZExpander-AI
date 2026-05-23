
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

const features = [
  "Expand short sentences into detailed paragraphs",
  "Choose from multiple leading AI models",
  "Preserve your expansion history",
  "Upload text files for easy input",
  "Light and Dark mode support",
  "Intuitive and easy-to-use interface"
];

export function HomeView() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/expand');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Logo className="w-12 h-12 animate-pulse" />
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Logo className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground/90">ZExpander AI</h1>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <section className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight text-foreground/90 mb-4">
            Transform Your Sentences with AI
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            ZExpander AI effortlessly expands your short sentences into detailed, articulate paragraphs, powered by the world's most advanced language models.
          </p>
          <Button asChild size="lg" className="font-bold text-lg">
            <Link href="/signup">Get Started for Free</Link>
          </Button>
        </section>
        
        <section className="max-w-4xl mx-auto mt-20 w-full">
            <h3 className="text-2xl font-bold text-center mb-8">Why ZExpander AI?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-foreground/90">{feature}</p>
                    </div>
                ))}
            </div>
        </section>
      </main>

      <footer className="text-center text-xs text-muted-foreground p-4 bg-background/50">
        <div className="container mx-auto">
          <span>© {new Date().getFullYear()} ZExpander AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return <HomeView />;
}