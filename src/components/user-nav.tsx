import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Zap, ChevronUp, User, Crown, Shield, Sparkles, Calendar, Activity } from 'lucide-react';
import type { AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PLAN_LIMITS } from '@/lib/constants';
import { motion } from 'framer-motion';

interface UserNavProps {
  user: AppUser;
  onSignOut: () => void;
  side?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  triggerVariant?: 'avatar' | 'detailed';
}

const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAADsUlEQVR4nO2dS27bQBBEX0I79ga+kTeSm4QHeqR8hqQsBXKUsOuAFEXOoFmSIkWRGmqm+70FBBiZ+HWP093TxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMAfAdQFAAqPoFAAAAAABJRU5ErkJggg==';

const planColors = {
  Free: 'from-gray-500 to-gray-600',
  Pro: 'from-blue-500 to-blue-600',
  Unlimited: 'from-purple-500 to-pink-500',
};

const planIcons = {
  Free: Shield,
  Pro: Sparkles,
  Unlimited: Crown,
};

export function UserNav({ user, onSignOut, side = 'bottom', align = 'end', triggerVariant = 'avatar' }: UserNavProps) {
  const navigate = useNavigate();

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return name.charAt(0).toUpperCase();
    }
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const totalTokens = PLAN_LIMITS[user.plan]?.tokens || 0;
  const tokensUsed = user.dailyTokensUsed || 0;
  const progress = totalTokens > 0 ? (tokensUsed / totalTokens) * 100 : (user.plan === 'Unlimited' ? 100 : 0);
  const tokensUsedDisplay = user.plan === 'Unlimited' ? 'Unlimited' : `${tokensUsed}/${totalTokens}`;

  const PlanIcon = planIcons[user.plan as keyof typeof planIcons] || Shield;

  const triggerContent = triggerVariant === 'avatar' ? (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
      <div className="relative p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || defaultAvatar} alt={user?.displayName || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-foreground">
            {getInitials(user?.displayName, user?.email)}
          </AvatarFallback>
        </Avatar>
      </div>
      {user.plan !== 'Free' && (
        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background">
          <div className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  ) : (
    <div className="flex items-center gap-3 w-full text-left group">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
        <div className="relative p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || defaultAvatar} alt={user?.displayName || 'User'} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-foreground text-sm">
              {getInitials(user?.displayName, user?.email)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-background">
          <div className={cn("p-0.5 rounded-full bg-gradient-to-br", planColors[user.plan as keyof typeof planColors])}>
            <PlanIcon className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground/90 truncate flex items-center gap-1.5">
          {user.displayName || 'User'}
          {user.plan !== 'Free' && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gradient-to-r text-white", planColors[user.plan as keyof typeof planColors])}>
              {user.plan}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Activity className="h-2.5 w-2.5" />
          {tokensUsedDisplay} tokens used
        </p>
      </div>
      <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
            triggerVariant === 'detailed'
              ? 'w-full h-auto px-3 py-2 justify-start hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-600/5 rounded-xl'
              : 'relative h-10 w-10 rounded-full p-0 hover:bg-transparent'
          )}>
          {triggerContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-xl p-1"
        side={side}
        align={align}
      >
        {/* User Header Section */}
        <div className="relative mb-2">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl blur-xl" />
          <div className="relative p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-md opacity-60" />
                  <div className="relative p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user?.photoURL || defaultAvatar} alt={user?.displayName || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 text-foreground text-lg font-semibold">
                        {getInitials(user?.displayName, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background">
                    <div className={cn("p-1 rounded-full bg-gradient-to-br", planColors[user.plan as keyof typeof planColors])}>
                      <PlanIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-foreground/90 truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email || 'No email provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={cn("p-1 rounded-lg bg-gradient-to-br", planColors[user.plan as keyof typeof planColors])}>
                  <PlanIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground/90">{user.plan} Plan</p>
                  <p className="text-[10px] text-muted-foreground">
                    {user.plan === 'Unlimited' ? 'Everything included' : 'Upgrade for more'}
                  </p>
                </div>
              </div>
              {user.plan !== 'Unlimited' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/plans')}
                  className="h-7 px-3 text-xs rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                >
                  Upgrade
                </Button>
              )}
            </div>

            {/* Token Usage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Token Usage
                </span>
                <span className="font-medium text-foreground/90">
                  {user.plan === 'Unlimited' ? '∞' : `${totalTokens - (tokensUsed || 0)} remaining`}
                </span>
              </div>
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
                  <div
                    style={{ width: `${Math.min(progress, 100)}%` }}
                    className={cn(
                      "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 rounded-full",
                      progress > 80 ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-blue-500 to-purple-600"
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <span>Used: {tokensUsed || 0}</span>
                <span>Total: {totalTokens}</span>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border/50" />

        {/* Menu Items */}
        <div className="p-1 space-y-0.5">
          <DropdownMenuItem
            onSelect={() => navigate('/settings')}
            className="rounded-lg cursor-pointer transition-all duration-200 focus:bg-primary/10 focus:text-primary"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <kbd className="ml-auto text-[10px] text-muted-foreground">⌘S</kbd>
          </DropdownMenuItem>

          {user.plan !== 'Unlimited' && (
            <DropdownMenuItem
              onSelect={() => navigate('/plans')}
              className="rounded-lg cursor-pointer transition-all duration-200 focus:bg-primary/10 focus:text-primary"
            >
              <Zap className="mr-2 h-4 w-4" />
              <span>Upgrade Plan</span>
              <Badge className="ml-auto text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                Save 20%
              </Badge>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={() => navigate('/profile')}
            className="rounded-lg cursor-pointer transition-all duration-200 focus:bg-primary/10 focus:text-primary"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => navigate('/billing')}
            className="rounded-lg cursor-pointer transition-all duration-200 focus:bg-primary/10 focus:text-primary"
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Billing</span>
            {user.plan === 'Free' && (
              <span className="ml-auto text-[10px] text-muted-foreground">No active subscription</span>
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem
          onSelect={onSignOut}
          className="rounded-lg cursor-pointer transition-all duration-200 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50/70 dark:focus:bg-red-900/20 mt-1"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>

        {/* Footer */}
        <div className="px-3 py-2 mt-2">
          <p className="text-[10px] text-center text-muted-foreground">
            {user.plan === 'Unlimited' ? '✨ Unlimited access to all features' : '🚀 Upgrade to unlock unlimited access'}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper Badge component for the upgrade menu item
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium", className)}>
      {children}
    </span>
  );
}