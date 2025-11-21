
"use client";

import { useRouter } from 'next/navigation';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Zap, ChevronUp } from "lucide-react";
import type { AppUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CircularProgress } from './ui/circular-progress';
import { PLAN_LIMITS } from '@/hooks/use-auth';

interface UserNavProps {
  user: AppUser;
  onSignOut: () => void;
  side?: "bottom" | "top" | "left" | "right";
  align?: "start" | "center" | "end";
  triggerVariant?: 'avatar' | 'detailed';
}

const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYYAAAGGCAMAAACyCj2tAAADAFBMVEUAAAA/PSdBQCZDQydFREpHR09LTlJOTlhPUV5UT1lXUVtcV2BdWWZgWmtoZHNpZH5vZXRwbH52dHx3dX97e4F8fYKAgoaCg4qEg4+JhIuLio+Oi5SOjpWUkJeYlpycm52em6CfoqWjpKqmpq6qqrCurrSysrewtL2xtL+zuLq7u8C9vsHCw8XDxMjExcvGxc7Jyc/KytPLy9TMzNbPz9nS09vU1dXW1tjZ2tve3t/g4OHh4eLi4uXk5Ofn5+jo6Onp6erq6uvr6+zs7O3t7e7u7vDw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f5+fn6+vr7+/v8/Pz9/f3+/v4/Pz8/Pz9AQCFAQSFBQyJCQyRDRCVDRSdERClFRitGRzBHRzFJSDRLSDRMTTZOTThQUjlRUjpVVztXVz5YWj9ZWkFaW0JbW0NcXENeXkRgYURiYkVkZEhmZkhpZ0lqaUpra0xsbU5zc1h0dVt2d1x3eF55eV96emB8fGCBgWGHhWOKimSLi2aMjGeOjmhQkGlQkWpQkmtRk2xSlW9WmXFXnXRZoHhcpXpgqX9msIFrtYdvyI5y0Z511aF21qJ42qZ526h63Kt83q9937GA4bGE47OI5beO57iR6cCV6sOY68ua7M6e7tGh79Oi8NSl8tal89mm9Nyn9d2p9t+s+OCt+eGu+uKy/Oa0/em2/uu4/u26/++8//DAwL3BwL7CwMLDwsbFwsfGw8jHw8nIxMnKxsvLxszMx83OyM/QydDSzNLSz9PV0NXW0dbX0tfY09jZ1dnd1tvd193g2N/i2uHj2+Pl3eTm3uXo3+bq4efs4ujt4+ru5Ozv5e3x5u/y6fL06/T17PX27fb37vf47/j58Pn68fr78vv89fz99f3++v7//f4/Pz9CQkNEREdJSUlMTExOTk5SUlJXV1daWlpeXl5jY2Nra2tud3d4eHh7e3t/f3+IiIiNjY2RkZGVlZWbm5ukpKStra2ysrK4uLi+vr7CwsLGxsbJycnMzMzT09PW1tbb29vg4ODl5eXp6enr6+vt7e3w8PDy8vL19fX4+Pj6+vr8/Pz+m/3dAAAAAXRSTlMAQObYZgAACHpJREFUeNrt2+FtVEUUxvEZiCgqKgIKimIWURTFzKIGRSyIIqiYicGKYoJowoJBBGNBsYBYUDBBEBEEQXwBsfj9g/f9/fR0z6lT77w5M9/r7L2WlDtzupc+p6d3T1R1T4pUVe85kR30vOQkF7k3+cM/S1I7g5U7/NU72HmpMzd0T/N07wR2D+d9e4a9E3sMdj/n5U5u+cE/uucT/smd2PNzC6Z29sxcnd8zn/Vn523u1Ny+KTu/Ym7fzN29C9s7N/QeTfE0d45nQ3A1BveZ1H0m9p3ePaZ1z6ndx0zP+cxtnQ/TPI3z3Jc5/vVfM09h9sQ+k/PjM3bm4s3ceJs7d2Luzc2Y2/N3YGL+2Z05p3N95vbOHf1Tmh/4Z3Q2+Cc0VftmdfaM3r+1d2DuXd2ZtXs3du092gO/e7xP8xz/MM/2D/wT+wd/z8zNmZ85O3fuzv3sPZuDM29u94zf/Zub87P0n+Z5mtv3zH92zt65t3fu7/2bP/dn3t57PO9jnt9rft/k+Q9/+4f/9h8zD6Z2Zub+nfsze+bm3kM0xz/v8xzf4Hma/3T/x3/u/Zubc3fu4s3vOZfzb+3s4J/U/Zvbczf3HkxxfJvneZrn+b7P8zz/YM+hn9i5k3k/ZubEzP2T+/Nuzcz9mZube/c+pnef6P0T/Z+bd2Zuzsyd+1//7T9+zt6Zuzdz7+7sPdu7z/M8z/M8z/P9nz/6hz/6h/b+jM3DmTc3t2/2/o3tm9szd+bmzt3Ye/QO/cOeX3P/3j+bN3N37+HcM/v/1vYczfE8z+b/PPZpnu/z/Ic/v/+zd/dm7t3e83ve43meyPme5/N8n+d5ft/k/Qf/2D+4e/f+2Z3Zszv3s//rOZuD8z+b8zN3/s/m3zO/Zvb+jf/u+Z7n+T7P8z/t/z/4B3/w9+/f2fub+zd3z/6e7P08z/M8z/N8n+d5nuf7PP83P/QPZt7My93cGZu59x7tmZv3Hu2Zuzv3s/f8ns3+D/3d8z3P83ye53me53me5/k+z/M8z/t/8A/+wZ7f4z3es3v37oO592j+B3N37+492n+y53me5/k+z/M8z/M8z/M8z/P8nuf3eJ5neZ7v/cHf/7P3/J7P8zzv82zP7/E8z/s8z/P8nufzPM/zPL9nf8+Z+3fu7p19e3p+73me53mez/t/8E/+wd/7/T+Ye5DmeJ5nef4/7oO5p/d4nufz/f88j38YhVFI/yMK+w8y/cMoDKPwn0Bh/p+oA8MoyH+Qwf8jYRhGeRgG0X/8jD9sGEbh/x4MgyjMoBCGUQhD/0cRhmEYhWEYhuEfh2EYRmEYhiEIgzAMgyjMoBCGYRgGYSKGeRiGYRgGIQhDMIxCMIxCGEZBGIZhGFMkjGEQRiEIwzAOgygMIxCEYRjGsBAjMYRCCMIwCsMwDGNYgBEYhiAMo/AfPAbDKAwhCEPQ//EMgzCMwjCMQhCGYRiGIRiGQRiGYRiEIQhDMIwiMEIhCOIfwwhkGEZhGEZDGIZBGEZhmIchCMIIjMIIDCPI/zD6hyjMwyAMo/D/Q2H4h1EYRhSGIQhDIYxCGAZhmIfh/wEMwwhMIQjDMKxBGIahIYwwhCAIwzCMgyAMYRiGIRhGIwjCIKxgGEZhmIehDIIwDMNg/EMhDMEIDMNYIKEQhCAIwzAMIwhCMIwhCIMwDMPwMMLwAIYhCEIQhGEYhiAMwwgMIwhCEIRBEARhGISBGIZhGIchCMIYhiEIgzAMgwgMIRCEYRjGIRhCMIRBGEZhmIZhGIZhCIIgCMIwhCEIgiAEgzAMgyEIwzAMgzAMgzAIgzAMIwhCMIRhGEZhmIEYYTiH92iCoygIoyhKoyCMw/c8RzD/z6mCojCMijIMoyCMw/e8R/j8P6cKCqOwV2H/YQxDsA8h6H/vMcZ//J8TBYVhmIcwhGAehiGIf+9RjH8YhUGEoQhDMI9hGPr/h3oI/9+JCobhf4QhCMIIzCMIQyEIQ9D/3iOEQRjGIVwIQxD0P/R//L/nBCoIh3/sQwiCIP5DEIR/6EP4h//pXMD/cQwhDEIQ/sN/6If//y/nBGrw/x36QxCGEIjCMIRhGEZh/H/v/08qCIcwDEIQhCAIgzD6f8//z/2hCsIgDEIQhCAIgiAMg/D6N8/D4eqMIwhCEIQhCAIwzAIfwz6P+ghlVUYhCAIQhAEoRAMgwgG/Q8zSMUIjCEIgyAMg/CHQRj9g+wjhSEYwzAOgzAMAyj8QxAIf+g/5n+EYBjGoRCGYRgGYYTiH8K/+A9x/EMgDMPwMIzDMATDGIx/CIw/CAQhDMNADMIQDMMwCMMwDMIwDCMoRAMQxCGYRjGIBj6QxRmMISBGEZhmIbB/x8Mhj8MIwiDMIzCMIzD/x9hGIYhGAZBEIRBmIbhPwbD/x5mGIYhGEIQhCAIQxCGIQiCIAxCGIZhGISh//EwDMNYCMKQ/yAIgyAEgzCMw/CP/+g/YfQPIyCEQRhCEARBEAwhCP/xH8Y//P+hP/D/QyEMYRgGYRjGQQhCEIQhCMYgCIIgDEIY/j98DMPQH8YhDMEIDMIQDMMgCIMQDMMwDMNwH69h/J/xCMYQDCMY/mEIgzAMAxjGQQjCIKxBMIzCMAzDMBCEYRiGYSj+w+oYBmEYhv/hMIzCEBhmYBiGYSCEIRgGYRgGQRjGIRiGYRCG9wiDMRD+IRAGQxiGMIShMIwhCAIgzAMYzCGoQhDIQzDMIxhGMYgDMMwDMIwDMIwjMIwDMNQjMMIDCMQhiEIQxiG/jAMIxiGYSCEIRhGMJiDYQgDIRjGcRjGYQiGIRjG/R+GQTAMgygIYzAMgzAMwjCMgzCGIQgG0T+GQRiGQQjCMIQhDMIw+ofhi38MhzAMg/AfxzAMYzCMQRgG4R/G/yEMQxAEgyAMgzCMQxCGIQjDcAyGIRiGQRiGQRgGYYQhCMYw/z8EYRCEYRAMgwj+gzMIQxCMgyAMgzAMhSEYhmEYBGEYhGEQhmEYhmEYRiEIwzAMg/Af/j8MgyEIQxAEgyAMgzAMQyEMYzAMAxCEYQiGQRiGIRgGIRjGYAyDIYxhmIchCEIIjEIYzMEYhCEYRiEIgzAIwzAMg/AfwzCGIQgDMIX+w17+P3n3eF7vMZrn+T7f87zf4/c8v+d7PPeP3uP5PZrn+X/P9/kef+/RHM/7PO/xPN/z/H/t/p7n/z/Z53mez/k9z/P9HucznueznM+f6jl+r+fxPs/jPO/zeZ7v+Tyf5/k9nuc5nucznueTnM+f5Hn+Xs/z/F7P43u+z/M8z+fxXM8P+Xguz/P4nuf5fJ7n8zzP8zzP8zzP5/l8z/d5nucznueTfL7Pc3ye53k8z/M8j+fxnc/j+T/9LzXz/y3e/3V7oKq651Z20POQk1zk3uTzXpPknB+5u/fsnf/k3hO55/V4nufz/f8+n+f5POfnHPc5n+d5fM/z/P6ez/OcPz90z3w5tmdOzfmdPz/0z3mez3M+z/P4nc/j+bzncyf6zHuez/k8z+d5nuf1/H/28L8A3/Z56J8224cAAAAASUVORK5CYII=';

export function UserNav({ user, onSignOut, side = 'bottom', align = "end", triggerVariant = 'avatar' }: UserNavProps) {
    const router = useRouter();

    const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
      if (name) {
          const names = name.split(' ');
          if (names.length > 1) {
              return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
          }
          return name.charAt(0).toUpperCase();
      }
      if (email) return email.charAt(0).toUpperCase();
      return 'U';
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    }
    
    const triggerContent = triggerVariant === 'avatar' ? (
        <div className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || defaultAvatar} data-ai-hint="user avatar" alt={user?.displayName || 'User'} />
                <AvatarFallback>{getInitials(user?.displayName, user?.email)}</AvatarFallback>
            </Avatar>
        </div>
    ) : (
        <div className="flex items-center gap-2 w-full text-left">
             <div className="p-0.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || defaultAvatar} alt={user?.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user?.displayName, user?.email)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground/90 truncate">
                    {user.displayName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {user.plan} Plan
                </p>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
    );

    const totalTokens = PLAN_LIMITS[user.plan]?.tokens || 0;
    const tokensUsed = user.dailyTokensUsed || 0;
    const progress = totalTokens > 0 ? (tokensUsed / totalTokens) * 100 : (user.plan === 'Unlimited' ? 100 : 0);
    const remainingTokens = user.plan === 'Unlimited' ? '∞' : Math.max(0, totalTokens - tokensUsed);


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    className={cn(
                        "transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
                        triggerVariant === 'detailed' 
                            ? 'w-full h-auto px-2 py-1.5 justify-start hover:bg-accent/50 rounded-xl' 
                            : 'relative h-10 w-10 rounded-full p-0'
                    )}
                >
                    {triggerContent}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                className="w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-lg" 
                side={side} 
                align={align}
            >
                <div className="px-4 py-3 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-semibold text-foreground/90 truncate">
                            {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user.email || 'No email provided'}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <CircularProgress value={progress} size={40} strokeWidth={3}>
                            {remainingTokens}
                        </CircularProgress>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleNavigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
                {user.plan !== 'Unlimited' && (
                    <DropdownMenuItem onSelect={() => handleNavigate('/plans')}>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Upgrade Plan</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSignOut} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50/70 dark:focus:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
