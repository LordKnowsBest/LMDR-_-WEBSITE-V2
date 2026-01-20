/**
 * LMDR Global Theme Utility
 * Provides light/dark mode toggle functionality across all dashboards
 * Usage: Include this script and call initTheme() on DOMContentLoaded
 */

const LMDR_THEME = {
    STORAGE_KEY: 'lmdr-theme-preference',

    /**
     * Initialize theme system
     * @param {string} defaultTheme - 'light' or 'dark'
     */
    init: function(defaultTheme = 'dark') {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Priority: saved > system preference > default
        const theme = savedTheme || (prefersDark ? 'dark' : defaultTheme);
        this.apply(theme);

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.apply(e.matches ? 'dark' : 'light');
            }
        });

        return theme;
    },

    /**
     * Apply theme to document
     * @param {string} theme - 'light' or 'dark'
     */
    apply: function(theme) {
        const html = document.documentElement;

        if (theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
        }

        // Update any toggle buttons
        this.updateToggleButtons(theme);

        // Dispatch event for custom handling
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    /**
     * Toggle between light and dark
     * @returns {string} - New theme
     */
    toggle: function() {
        const current = this.get();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.set(newTheme);
        return newTheme;
    },

    /**
     * Get current theme
     * @returns {string} - 'light' or 'dark'
     */
    get: function() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },

    /**
     * Set and persist theme
     * @param {string} theme - 'light' or 'dark'
     */
    set: function(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.apply(theme);
    },

    /**
     * Update toggle button states
     * @param {string} theme - Current theme
     */
    updateToggleButtons: function(theme) {
        const toggles = document.querySelectorAll('[data-theme-toggle]');
        toggles.forEach(toggle => {
            const sunIcon = toggle.querySelector('[data-theme-icon="sun"]');
            const moonIcon = toggle.querySelector('[data-theme-icon="moon"]');

            if (sunIcon && moonIcon) {
                if (theme === 'dark') {
                    sunIcon.classList.remove('hidden');
                    moonIcon.classList.add('hidden');
                } else {
                    sunIcon.classList.add('hidden');
                    moonIcon.classList.remove('hidden');
                }
            }

            // Update aria-label
            toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        });
    },

    /**
     * Create a theme toggle button HTML
     * @param {string} size - 'sm', 'md', 'lg'
     * @returns {string} - HTML string
     */
    createToggleButton: function(size = 'md') {
        const sizes = {
            sm: { btn: 'w-8 h-8', icon: 'text-[16px]' },
            md: { btn: 'w-10 h-10', icon: 'text-[20px]' },
            lg: { btn: 'w-12 h-12', icon: 'text-[24px]' }
        };
        const s = sizes[size] || sizes.md;

        return `
            <button
                data-theme-toggle
                onclick="LMDR_THEME.toggle()"
                class="theme-toggle touch-active flex items-center justify-center ${s.btn} rounded-lg bg-surface-dark dark:bg-surface-dark light:bg-white border border-border-dark dark:border-border-dark light:border-slate-200 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 transition-colors"
                aria-label="Toggle theme"
                title="Toggle light/dark mode"
            >
                <span data-theme-icon="sun" class="material-symbols-outlined ${s.icon} text-amber-400 hidden">light_mode</span>
                <span data-theme-icon="moon" class="material-symbols-outlined ${s.icon} text-slate-400">dark_mode</span>
            </button>
        `;
    }
};

// Auto-init if script is loaded directly
if (typeof window !== 'undefined') {
    window.LMDR_THEME = LMDR_THEME;
}
