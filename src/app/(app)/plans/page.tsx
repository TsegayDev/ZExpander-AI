
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Zap, Shield, Crown } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { UserPlan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { PLAN_LIMITS } from '@/hooks/use-auth';

const plans = [
    {
        name: "Free",
        price: "$0",
        priceFrequency: "/ month",
        tokens: PLAN_LIMITS.Free.tokens,
        fileUploads: PLAN_LIMITS.Free.fileUploads,
        features: [
            `${PLAN_LIMITS.Free.tokens.toLocaleString()} tokens per day`,
            `${PLAN_LIMITS.Free.fileUploads} file uploads per day`,
            "Access to Gemini Flash",
            "Expansion history",
        ],
        cta: "Current Plan",
        variant: 'outline' as const,
        planId: 'Free' as UserPlan,
        Icon: Zap,
    },
    {
        name: "Pro",
        price: "$10",
        priceFrequency: "/ month",
        tokens: PLAN_LIMITS.Pro.tokens,
        fileUploads: PLAN_LIMITS.Pro.fileUploads,
        features: [
            `${PLAN_LIMITS.Pro.tokens.toLocaleString()} tokens per day`,
            `${PLAN_LIMITS.Pro.fileUploads} file uploads per day`,
            "Access to all AI models",
            "Priority support",
        ],
        cta: "Upgrade to Pro",
        variant: 'default' as const,
        planId: 'Pro' as UserPlan,
        Icon: Shield,
    },
    {
        name: "Ultimate",
        price: "$25",
        priceFrequency: "/ month",
        tokens: "Unlimited",
        fileUploads: "Unlimited",
        features: [
            "Unlimited tokens",
            "Unlimited file uploads",
            "Early access to new models",
            "24/7 dedicated support",
        ],
        cta: "Upgrade to Ultimate",
        variant: 'outline' as const,
        planId: 'Unlimited' as UserPlan,
        Icon: Crown,
    }
];

export default function PlansPage() {
    const { user, loading, updateUserPlan } = useAuth();
    const { toast } = useToast();
    const [isUpgrading, setIsUpgrading] = useState<UserPlan | null>(null);
    const router = useRouter();

    const handleSelectPlan = async (planId: UserPlan) => {
        if (!user) {
            toast({ title: "You must be signed in to upgrade.", variant: "destructive" });
            return;
        }

        setIsUpgrading(planId);

        try {
            await updateUserPlan(planId);

            toast({
                title: "Plan updated!",
                description: `You are now on the ${planId} plan.`
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to update plan:", error);
            toast({
                title: "Upgrade failed",
                description: "Could not update your plan. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUpgrading(null);
        }
    };
    
    return (
        <div className="flex-1 p-4 sm:p-8 pt-6">
             <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-foreground/90">
                        Find the perfect plan
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start for free, and scale up as you grow. All plans include access to our core features.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card 
                            key={plan.name} 
                            className={cn(
                                "flex flex-col shadow-lg rounded-2xl transition-all duration-300",
                                user?.plan === plan.planId ? 'border-primary ring-2 ring-primary' : 'border-border/80'
                            )}
                        >
                            <CardHeader className="p-6">
                                <div className="flex items-center gap-3">
                                     <plan.Icon className={cn("w-8 h-8", user?.plan === plan.planId ? "text-primary" : "text-muted-foreground")} />
                                     <CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle>
                                </div>
                                <CardDescription className="flex items-baseline gap-1 pt-2">
                                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.priceFrequency}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow p-6 space-y-4">
                                <p className="font-semibold text-sm">{plan.tokens.toLocaleString()} tokens / day</p>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="p-6 mt-auto">
                                <Button
                                    className="w-full font-bold"
                                    variant={user?.plan === plan.planId ? 'outline' : plan.variant}
                                    disabled={loading || user?.plan === plan.planId || isUpgrading !== null}
                                    onClick={() => handleSelectPlan(plan.planId)}
                                >
                                     {isUpgrading === plan.planId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {user?.plan === plan.planId ? "Current Plan" : plan.cta}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-8">
                    Prices are illustrative. This is a demo application and does not process real payments.
                </p>
             </div>
        </div>
    )
}
