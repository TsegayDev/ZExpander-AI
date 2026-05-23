"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-100/80 to-gray-100/80 dark:from-slate-900/50 dark:to-gray-900/50 p-2 backdrop-blur-sm",
      "shadow-lg shadow-black/5 border border-white/20 dark:border-white/10",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
      "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",

      // Active & Inactive states
      "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-black/20",
      "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-300",
      "data-[state=inactive]:hover:text-gray-900 dark:data-[state=inactive]:hover:text-white",

      // Active background gradient with different colors per tab position
      "data-[state=active]:bg-gradient-to-r",
      "[&:nth-child(1)]:data-[state=active]:from-blue-500 [&:nth-child(1)]:data-[state=active]:to-blue-600",
      "[&:nth-child(2)]:data-[state=active]:from-purple-500 [&:nth-child(2)]:data-[state=active]:to-purple-600",
      "[&:nth-child(3)]:data-[state=active]:from-pink-500 [&:nth-child(3)]:data-[state=active]:to-rose-600",
      "[&:nth-child(4)]:data-[state=active]:from-green-500 [&:nth-child(4)]:data-[state=active]:to-emerald-600",
      "[&:nth-child(5)]:data-[state=active]:from-orange-500 [&:nth-child(5)]:data-[state=active]:to-red-600",
      "[&:nth-child(6)]:data-[state=active]:from-teal-500 [&:nth-child(6)]:data-[state=active]:to-cyan-600",

      // Inactive background
      "data-[state=inactive]:bg-transparent",

      // Hover effect for inactive tabs
      "data-[state=inactive]:hover:bg-white/50 dark:data-[state=inactive]:hover:bg-white/10",

      className
    )}
    {...props}
  >
    {/* Content with proper z-index */}
    <span className="relative z-10 flex items-center gap-2">
      {children}
    </span>
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "flex-1 flex flex-col",
      "animate-in fade-in-0 zoom-in-95 duration-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Alternative: Subtle underline design
const TabsListSubtle = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-center gap-1 rounded-2xl bg-transparent p-1",
      className
    )}
    {...props}
  />
))
TabsListSubtle.displayName = "TabsListSubtle"

const TabsTriggerSubtle = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
      "rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",

      // Text colors
      "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white",
      "data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400",
      "data-[state=inactive]:hover:text-gray-700 dark:data-[state=inactive]:hover:text-gray-200",

      // Bottom border/underline for active state with gradient colors
      "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:transition-all after:duration-300",
      "data-[state=active]:after:w-[calc(100%-2rem)]",
      "[&:nth-child(1)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(1)]:data-[state=active]:after:from-blue-500 [&:nth-child(1)]:data-[state=active]:after:to-blue-600",
      "[&:nth-child(2)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(2)]:data-[state=active]:after:from-purple-500 [&:nth-child(2)]:data-[state=active]:after:to-purple-600",
      "[&:nth-child(3)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(3)]:data-[state=active]:after:from-pink-500 [&:nth-child(3)]:data-[state=active]:after:to-rose-600",
      "[&:nth-child(4)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(4)]:data-[state=active]:after:from-green-500 [&:nth-child(4)]:data-[state=active]:after:to-emerald-600",
      "[&:nth-child(5)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(5)]:data-[state=active]:after:from-orange-500 [&:nth-child(5)]:data-[state=active]:after:to-red-600",
      "[&:nth-child(6)]:data-[state=active]:after:bg-gradient-to-r [&:nth-child(6)]:data-[state=active]:after:from-teal-500 [&:nth-child(6)]:data-[state=active]:after:to-cyan-600",

      className
    )}
    {...props}
  >
    <span className="relative z-10 flex items-center gap-2">
      {children}
    </span>
  </TabsPrimitive.Trigger>
))
TabsTriggerSubtle.displayName = "TabsTriggerSubtle"

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListSubtle,
  TabsTriggerSubtle
}