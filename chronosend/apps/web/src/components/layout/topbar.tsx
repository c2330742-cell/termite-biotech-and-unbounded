import { useAuth } from '../../contexts/auth-context';
import { useWebSocket } from '../../contexts/websocket-context';
import { useTheme } from '../../contexts/theme-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Menu, Moon, Sun, LogOut, Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const { connected: wsConnected } = useWebSocket();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-accent rounded-md">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        {wsConnected ? (
          <Wifi className="h-4 w-4 text-green-500" title="Connected" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />
        )}
      </div>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full p-0.5 hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user?.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
