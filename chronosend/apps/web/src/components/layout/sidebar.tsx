import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/auth-context';
import {
  LayoutDashboard,
  Send,
  ListTodo,
  History,
  Settings,
  Shield,
  X,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/compose', icon: Send, label: 'Compose' },
  { to: '/queue', icon: ListTodo, label: 'Queue' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin, hasCredentials } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-accent">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">ChronoSend</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-sidebar-accent rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.to === '/settings' && hasCredentials === false && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500" title="Configure delivery methods" />
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 mx-3 h-px bg-sidebar-accent" />
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <Shield className="h-5 w-5" />
                Admin
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-sidebar-accent p-4 text-xs text-sidebar-foreground/50">
          ChronoSend v1.0.0
        </div>
      </aside>
    </>
  );
}
