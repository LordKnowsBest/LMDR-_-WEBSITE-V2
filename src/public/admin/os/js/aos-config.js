// ============================================================================
// AOS-CONFIG — AdminOS Configuration Registry
// ============================================================================

(function () {
    'use strict';

    window.AOS = window.AOS || {};

    AOS.config = {
        brand: {
            logo: 'VELOCITYMATCH',
            icon: 'admin_panel_settings',
            tenant: 'Admin System'
        },

        // ── Structure definition for the left-rail 'Command Strip' ──
        drawers: [
            { id: 'core', label: 'Core Operations', icon: 'dashboard', iconGradient: 'from-blue-500 to-indigo-600' },
            { id: 'users', label: 'User Management', icon: 'group', iconGradient: 'from-violet-500 to-fuchsia-600' },
            { id: 'finance', label: 'Finance & Billing', icon: 'payments', iconGradient: 'from-emerald-500 to-teal-600' },
            { id: 'ai', label: 'AI & Content', icon: 'smart_toy', iconGradient: 'from-cyan-500 to-blue-600' },
            { id: 'support', label: 'Support & Comms', icon: 'support_agent', iconGradient: 'from-rose-500 to-red-600' },
            { id: 'analytics', label: 'Analytics & telemetry', icon: 'monitoring', iconGradient: 'from-amber-500 to-orange-600' },
            { id: 'b2b', label: 'B2B Hub', icon: 'business', iconGradient: 'from-slate-500 to-zinc-600' },
            { id: 'api', label: 'API Portal', icon: 'api', iconGradient: 'from-sky-400 to-cyan-500' }
        ],

        // ── Predefined command bar actions ──
        commands: [
            { label: 'View Audit Log', icon: 'history', tooltip: 'Global activity stream' },
            { label: 'Check API Health', icon: 'medical_services', tooltip: 'Test external API latencies' },
            { label: 'Feature Flags', icon: 'flag', tooltip: 'Toggle global rollouts' },
            { label: 'Manage B2B', icon: 'domain', tooltip: 'Open B2B Pipeline' },
            { label: 'Server Logs', icon: 'terminal', tooltip: 'Open Velo trace logs' }
        ]
    };

    // ── Tool Registry matching 44 Admin HTML pages ──
    AOS.TOOL_REGISTRY = [
        // 1. Core Operations
        { id: 'home', drawer: 'core', name: 'Dashboard', icon: 'space_dashboard', view: 'home', gradient: 'from-slate-700 to-slate-900', badge: false },
        { id: 'platform_config', drawer: 'core', name: 'Platform Config', icon: 'settings', view: 'platform-config', gradient: 'from-slate-600 to-slate-800' },
        { id: 'feature_flags', drawer: 'core', name: 'Feature Flags', icon: 'flag', view: 'feature-flags', gradient: 'from-slate-600 to-slate-800' },
        { id: 'ab_tests', drawer: 'core', name: 'A/B Tests', icon: 'science', view: 'ab-tests', gradient: 'from-slate-600 to-slate-800' },
        { id: 'observability', drawer: 'core', name: 'Observability', icon: 'visibility', view: 'observability', gradient: 'from-blue-600 to-indigo-800', badge: true, animate: 'pulse' },

        // 2. User Management
        { id: 'drivers', drawer: 'users', name: 'Drivers', icon: 'local_shipping', view: 'drivers', gradient: 'from-violet-500 to-fuchsia-600' },
        { id: 'carriers', drawer: 'users', name: 'Carriers', icon: 'business_center', view: 'carriers', gradient: 'from-violet-500 to-fuchsia-600' },
        { id: 'matches', drawer: 'users', name: 'Matches', icon: 'handshake', view: 'matches', gradient: 'from-violet-500 to-fuchsia-600' },
        { id: 'reverse_matching', drawer: 'users', name: 'Reverse Matches', icon: 'compare_arrows', view: 'reverse-matching', gradient: 'from-violet-500 to-fuchsia-600' },

        // 3. Finance & Billing
        { id: 'rev_dashboard', drawer: 'finance', name: 'Revenue', icon: 'attach_money', view: 'revenue', gradient: 'from-emerald-500 to-teal-600' },
        { id: 'billing', drawer: 'finance', name: 'Billing', icon: 'receipt_long', view: 'billing', gradient: 'from-emerald-500 to-teal-600' },
        { id: 'invoicing', drawer: 'finance', name: 'Invoices', icon: 'request_quote', view: 'invoicing', gradient: 'from-emerald-500 to-teal-600' },
        { id: 'commissions', drawer: 'finance', name: 'Commissions', icon: 'account_balance_wallet', view: 'commissions', gradient: 'from-emerald-500 to-teal-600' },

        // 4. AI & Content
        { id: 'ai_router', drawer: 'ai', name: 'AI Router', icon: 'account_tree', view: 'ai-router', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'prompts', drawer: 'ai', name: 'Prompt Library', icon: 'library_books', view: 'prompts', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'content', drawer: 'ai', name: 'Content', icon: 'article', view: 'content', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'health_content', drawer: 'ai', name: 'Health Editor', icon: 'health_and_safety', view: 'health-content', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'moderation', drawer: 'ai', name: 'Moderation', icon: 'gavel', view: 'moderation', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'kb_list', drawer: 'ai', name: 'Knowledge Base', icon: 'menu_book', view: 'kb-list', gradient: 'from-cyan-500 to-blue-600' },
        { id: 'kb_editor', drawer: 'ai', name: 'KB Editor', icon: 'edit_document', view: 'kb-editor', gradient: 'from-cyan-500 to-blue-600' },

        // 5. Support & Comms
        { id: 'tickets', drawer: 'support', name: 'Tickets', icon: 'forum', view: 'tickets', gradient: 'from-rose-500 to-red-600' },
        { id: 'chat', drawer: 'support', name: 'Agent Chat', icon: 'chat', view: 'chat', gradient: 'from-rose-500 to-red-600' },
        { id: 'email_templates', drawer: 'support', name: 'Email Editor', icon: 'mail', view: 'email-templates', gradient: 'from-rose-500 to-red-600' },
        { id: 'notification_rules', drawer: 'support', name: 'Notifications', icon: 'notifications_active', view: 'notification-rules', gradient: 'from-rose-500 to-red-600' },

        // 6. Analytics & Telemetry
        { id: 'feature_adoption', drawer: 'analytics', name: 'Feature Adoption', icon: 'query_stats', view: 'feature-adoption', gradient: 'from-amber-500 to-orange-600' },
        { id: 'gamification_analytics', drawer: 'analytics', name: 'Gamification', icon: 'sports_esports', view: 'gamification-analytics', gradient: 'from-amber-500 to-orange-600' },
        { id: 'audit_log', drawer: 'analytics', name: 'Audit Log', icon: 'manage_search', view: 'audit-log', gradient: 'from-amber-500 to-orange-600' },
        { id: 'nps', drawer: 'analytics', name: 'NPS Scores', icon: 'thumb_up', view: 'nps', gradient: 'from-amber-500 to-orange-600' },
        { id: 'kb_analytics', drawer: 'analytics', name: 'KB Analytics', icon: 'analytics', view: 'kb-analytics', gradient: 'from-amber-500 to-orange-600' },

        // 7. B2B Hub
        { id: 'b2b_dashboard', drawer: 'b2b', name: 'B2B Dashboard', icon: 'domain', view: 'b2b-dashboard', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_pipeline', drawer: 'b2b', name: 'B2B Pipeline', icon: 'view_kanban', view: 'b2b-pipeline', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_analytics', drawer: 'b2b', name: 'B2B Analytics', icon: 'insights', view: 'b2b-analytics', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_campaigns', drawer: 'b2b', name: 'B2B Campaigns', icon: 'campaign', view: 'b2b-campaigns', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_lead_capture', drawer: 'b2b', name: 'Lead Capture', icon: 'person_add', view: 'b2b-lead-capture', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_outreach', drawer: 'b2b', name: 'B2B Outreach', icon: 'connect_without_contact', view: 'b2b-outreach', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_research', drawer: 'b2b', name: 'B2B Research', icon: 'travel_explore', view: 'b2b-research', gradient: 'from-slate-500 to-zinc-600' },
        { id: 'b2b_account', drawer: 'b2b', name: 'Accounts', icon: 'corporate_fare', view: 'b2b-account', gradient: 'from-slate-500 to-zinc-600' },

        // 8. API Portal
        { id: 'api_dashboard', drawer: 'api', name: 'API Dashboard', icon: 'webhook', view: 'api-dashboard', gradient: 'from-sky-400 to-cyan-500' },
        { id: 'api_status', drawer: 'api', name: 'API Status', icon: 'dns', view: 'api-status', gradient: 'from-sky-400 to-cyan-500' },
        { id: 'api_docs', drawer: 'api', name: 'API Docs', icon: 'integration_instructions', view: 'api-docs', gradient: 'from-sky-400 to-cyan-500' },
        { id: 'api_changelog', drawer: 'api', name: 'Changelog', icon: 'update', view: 'api-changelog', gradient: 'from-sky-400 to-cyan-500' },
        { id: 'api_partners', drawer: 'api', name: 'API Partners', icon: 'handshake', view: 'api-partners', gradient: 'from-sky-400 to-cyan-500' }
    ];

    // Utility to fetch tools for a drawer
    AOS.getDrawerTools = function (drawerId) {
        return AOS.TOOL_REGISTRY.filter(t => t.drawer === drawerId);
    };

    // Helper function to resolve the current active tool
    AOS.getToolByView = function (viewId) {
        return AOS.TOOL_REGISTRY.find(t => t.view === viewId);
    };

})();
