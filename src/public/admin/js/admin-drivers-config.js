/* =========================================
   ADMIN DRIVERS — Config Module
   No dependencies
   ========================================= */
var AdminDriversConfig = (function () {
    'use strict';

    var THEME_KEY = 'lmdr-admin-theme';
    var DEBUG_MESSAGES = true;

    var MESSAGE_REGISTRY = {
        inbound: [
            'driversLoaded',
            'driverDetail',
            'statsLoaded',
            'actionSuccess',
            'actionError',
            'init',
            'pong',
            'emailRevealed',
            'exportReady'
        ],
        outbound: [
            'getDrivers',
            'getStats',
            'getDriverDetail',
            'verifyDriver',
            'suspendDriver',
            'bulkVerify',
            'bulkSuspend',
            'exportDrivers',
            'openMessageModal',
            'openAddDriverModal',
            'revealEmail',
            'ping'
        ]
    };

    var DEFAULT_FILTERS = {
        status: 'all',
        verification: 'all',
        tier: 'all',
        search: ''
    };

    var DEFAULT_PAGE_SIZE = 25;
    var DEFAULT_SORT_FIELD = 'lastActive';
    var DEFAULT_SORT_DIRECTION = 'desc';

    return {
        THEME_KEY: THEME_KEY,
        DEBUG_MESSAGES: DEBUG_MESSAGES,
        MESSAGE_REGISTRY: MESSAGE_REGISTRY,
        DEFAULT_FILTERS: DEFAULT_FILTERS,
        DEFAULT_PAGE_SIZE: DEFAULT_PAGE_SIZE,
        DEFAULT_SORT_FIELD: DEFAULT_SORT_FIELD,
        DEFAULT_SORT_DIRECTION: DEFAULT_SORT_DIRECTION
    };
})();
