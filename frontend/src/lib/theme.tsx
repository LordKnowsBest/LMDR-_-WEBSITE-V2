'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type Theme = 'light' | 'solar' | 'dark' | 'colorway';

const THEMES: { id: Theme; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: 'light_mode' },
    { id: 'solar', label: 'Solar', icon: 'wb_twilight' },
    { id: 'dark', label: 'Dark', icon: 'dark_mode' },
    { id: 'colorway', label: 'Colorway', icon: 'palette' },
];

interface ThemeContextValue {
    theme: Theme;
    setTheme: (t: Theme) => void;
    cycleTheme: () => void;
    themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');

    // Initialize from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('dos-theme') as Theme | null;
        if (saved && THEMES.some((t) => t.id === saved)) {
            setThemeState(saved);
            applyTheme(saved);
        }
    }, []);

    const applyTheme = (t: Theme) => {
        const doc = document.documentElement;
        doc.classList.remove('light', 'solar', 'dark', 'colorway');
        doc.classList.add(t);
    };

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        applyTheme(t);
        localStorage.setItem('dos-theme', t);
    }, []);

    const cycleTheme = useCallback(() => {
        setThemeState((prev) => {
            const idx = THEMES.findIndex((t) => t.id === prev);
            const next = THEMES[(idx + 1) % THEMES.length].id;
            applyTheme(next);
            localStorage.setItem('dos-theme', next);
            return next;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
