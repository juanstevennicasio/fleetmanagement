'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageService } from '../storage';

interface SystemConfig {
    appName: string;
    appLogo: string; // URL or base64
}

const DEFAULT_CONFIG: SystemConfig = {
    appName: 'LogiTrack Enterprise v5',
    appLogo: '' // Empty string means default logo or no logo
};

interface SystemConfigContextType {
    config: SystemConfig;
    updateConfig: (newConfig: Partial<SystemConfig>) => void;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export function SystemConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedSettings = StorageService.getSettings() as any;
        if (savedSettings && (savedSettings.appName || savedSettings.appLogo)) {
            setConfig({
                appName: savedSettings.appName || DEFAULT_CONFIG.appName,
                appLogo: savedSettings.appLogo || DEFAULT_CONFIG.appLogo
            });
        }
        setMounted(true);
    }, []);

    const updateConfig = (newConfig: Partial<SystemConfig>) => {
        const updated = { ...config, ...newConfig };
        setConfig(updated);
        StorageService.setSettings(updated);

        // Log the change
        StorageService.addAuditLog(
            'UPDATE_SETTINGS',
            `System settings updated: ${Object.keys(newConfig).join(', ')}`,
            'admin' // Assuming admin for now
        );
    };

    return (
        <SystemConfigContext.Provider value={{ config, updateConfig }}>
            {children}
        </SystemConfigContext.Provider>
    );
}

export function useSystemConfig() {
    const context = useContext(SystemConfigContext);
    if (context === undefined) {
        throw new Error('useSystemConfig must be used within a SystemConfigProvider');
    }
    return context;
}
