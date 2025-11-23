
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
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
  ChevronRight,
} from "lucide-react";
import sidebarConfig from "@/client/layouts/navigation.json";
import { usePermissions } from "@/client/hooks";

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

export function DashboardPage() {
  const { can, isLoading } = usePermissions();

  // Filter navigation items based on permissions
  const filteredNavigation = (sidebarConfig.navigation as NavigationItem[]).filter((item) => {
    // Dashboard is always visible
    if (!item.permission) return true;
    
    // Check permission for other items
    return can(item.permission);
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Quick access to all sections
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNavigation.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard;
          return (
            <Card
              key={item.href}
              className="hover:shadow-lg transition-shadow group"
            >
              <Link href={item.href}>
                <CardHeader className="pb-3 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {item.title}
                    </CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
              </Link>
              {item.submenu && item.submenu.length > 0 && (
                <CardContent>
                  <div className="space-y-1">
                    {item.submenu
                      .filter((subitem) => !subitem.permission || can(subitem.permission))
                      .map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          • {subitem.title}
                        </Link>
                      ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}