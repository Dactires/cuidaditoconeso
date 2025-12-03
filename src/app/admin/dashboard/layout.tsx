
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getAuth } from 'firebase/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { LayoutDashboard, LogOut, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/admin/login');
      return;
    }
    if (!isUserLoading && user) {
      user.getIdTokenResult().then((idTokenResult) => {
        if (!idTokenResult.claims.superadmin) {
          router.push('/admin/login');
        }
      });
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="comic-title text-2xl animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex-grow">
                <h2 className="font-semibold comic-title text-lg">Superadmin</h2>
                <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'}>
                <Link href="/admin/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard/cards'}>
                  <Link href="/admin/dashboard/cards">
                    <CreditCard />
                    <span>Cartas</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
                <LogOut /> <span>Cerrar Sesión</span>
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8 min-h-0 overflow-y-auto">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
