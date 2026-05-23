
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";
import { DangerZoneForm } from "@/components/danger-zone-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="flex-1 p-4 sm:p-8 pt-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-4">
                         <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                            <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>Update your personal information. Make sure to click save when you're done.</CardDescription>
                            </CardHeader>
                            <ProfileForm />
                        </Card>
                    </TabsContent>

                    <TabsContent value="password">
                         <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>Change your password here. After saving, you'll be logged out.</CardDescription>
                            </CardHeader>
                            <PasswordForm />
                        </Card>
                    </TabsContent>

                    <TabsContent value="danger">
                         <Card>
                            <CardHeader>
                                <CardTitle>Danger Zone</CardTitle>
                                <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                            </CardHeader>
                           <DangerZoneForm />
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
