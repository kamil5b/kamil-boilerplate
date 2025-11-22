"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, usePermissions } from "@/client/hooks";
import { Button } from "@/client/components/ui/button";
import { Separator } from "@/client/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Ruler,
  Calculator,
  Warehouse,
  Receipt,
  CreditCard,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import sidebarConfig from "./sidebar.json";
import { cn } from "@/client/utils";

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  store: Store,
  package: Package,
  ruler: Ruler,
  calculator: Calculator,
  warehouse: Warehouse,
  receipt: Receipt,
  creditCard: CreditCard,
  dollarSign: DollarSign,
  fileText: FileText,
};

interface SubmenuItem {
  title: string;
  href: string;
  permission?: string;
}

interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  permission?: string;
  submenu?: SubmenuItem[];
}

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Filter navigation items based on permissions
  const filteredNavigation = (sidebarConfig.navigation as NavigationItem[]).filter((item) => {
    // Items without permission requirement are always visible (e.g., Dashboard)
    if (!item.permission) return true;
    // Check if user has the required permission
    return can(item.permission);
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-xl font-bold">Kamil POS</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus[item.href] || false;

              return (
                <div key={item.href}>
                  {hasSubmenu ? (
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setExpandedMenus({ ...expandedMenus, [item.href]: !isExpanded })}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span className="flex-1 text-left">{item.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSidebarOpen(false)}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {item.title}
                      </Button>
                    </Link>
                  )}
                  
                  {/* Submenu */}
                  {hasSubmenu && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu!
                        .filter((subItem) => !subItem.permission || can(subItem.permission))
                        .map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link key={subItem.href} href={subItem.href}>
                              <Button
                                variant={isSubActive ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setSidebarOpen(false)}
                              >
                                {subItem.title}
                              </Button>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <Separator />

          {/* User Menu */}
          <div className="p-4 space-y-2">
            {user && (
              <div className="px-3 py-2 text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Role: {user.role.replace(/_/g, " ")}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
