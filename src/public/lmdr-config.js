/**
 * @file LMDR Brand Configuration
 * Note: 'tailwind' global is injected by the CDN script in the HTML head.
 */
/* global tailwind */

/**
 * LMDR Brand Configuration (Shared)
 * Single source of truth for design tokens.
 */
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                lmdr: {
                    dark: '#0f172a',      // Slate-900
                    blue: '#2563eb',      // Blue-600
                    yellow: '#fbbf24',    // Amber-400
                    'yellow-hover': '#f59e0b', // Amber-500
                    canvas: '#f8fafc',    // Slate-50
                },
                // Admin / Dashboard System Tokens
                primary: {
                    DEFAULT: '#2563eb',
                    dark: '#1d4ed8',
                },
                background: {
                    dark: '#0f172a',
                    light: '#f8fafc',
                },
                surface: {
                    dark: '#1e293b',
                    light: '#ffffff',
                    darker: '#0f172a',
                    lighter: '#f1f5f9',
                },
                border: {
                    dark: '#334155',
                    light: '#e2e8f0',
                },
                text: {
                    muted: '#94a3b8',
                    dark: '#0f172a',
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        }
    }
};
