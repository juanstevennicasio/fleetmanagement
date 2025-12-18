'use client';

import Navigation from "@/components/Navigation";
import { AuthProvider } from "./context/AuthContext";
import { SystemConfigProvider } from "./context/SystemConfigContext";
import { ToastProvider } from "@/components/ui/Toast";
import { usePathname } from "next/navigation";

function AppContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {!isLoginPage && <Navigation />}
            <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${!isLoginPage ? 'ml-64' : ''}`}>
                {children}
            </main>
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SystemConfigProvider>
                <ToastProvider>
                    <AppContent>{children}</AppContent>
                </ToastProvider>
            </SystemConfigProvider>
        </AuthProvider>
    );
}
