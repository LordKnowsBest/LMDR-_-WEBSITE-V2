/* =========================================
   ADMIN DRIVERS — Bridge Module
   Depends on: AdminDriversConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminDriversBridge = (function () {
    'use strict';

    var C = AdminDriversConfig;
    var connectionVerified = false;

    /* --- Security utilities --- */

    function isValidOrigin(event) {
        if (window.parent === window) {
            console.warn('SECURITY: Not running in iframe context');
            return false;
        }
        if (event.source !== window.parent) {
            console.warn('SECURITY: Message not from parent frame');
            return false;
        }
        return true;
    }

    function validateMessageSchema(msg) {
        if (!msg || typeof msg !== 'object') return false;
        if (typeof msg.action !== 'string' || msg.action.length === 0) return false;
        return true;
    }

    function validateInboundMessage(action) {
        if (!C.MESSAGE_REGISTRY.inbound.includes(action)) {
            console.warn('UNREGISTERED INBOUND MESSAGE: "' + action + '" - Add to MESSAGE_REGISTRY.inbound');
            return false;
        }
        return true;
    }

    function logMessageFlow(direction, action, data) {
        if (!C.DEBUG_MESSAGES) return;
        var arrow = direction === 'in' ? 'IN' : 'OUT';
        var label = direction === 'in' ? 'Velo->HTML' : 'HTML->Velo';
        console.log('[' + arrow + '] [' + label + '] ' + action, data ? Object.keys(data) : '(no data)');
    }

    /* --- Outbound messages --- */

    function sendToVelo(message) {
        var action = message.action;

        if (!C.MESSAGE_REGISTRY.outbound.includes(action)) {
            console.warn('UNREGISTERED OUTBOUND MESSAGE: "' + action + '" - Add to MESSAGE_REGISTRY.outbound');
        }

        logMessageFlow('out', action, message);
        window.parent.postMessage(message, '*');
    }

    function getDrivers(filters, page, pageSize, sortField, sortDirection) {
        sendToVelo({
            action: 'getDrivers',
            filters: filters,
            page: page,
            pageSize: pageSize,
            sortField: sortField,
            sortDirection: sortDirection
        });
    }

    function getStats() {
        sendToVelo({ action: 'getStats' });
    }

    function getDriverDetail(driverId) {
        sendToVelo({ action: 'getDriverDetail', driverId: driverId });
    }

    function verifyDriver(driverId) {
        sendToVelo({ action: 'verifyDriver', driverId: driverId });
    }

    function suspendDriver(driverId) {
        sendToVelo({ action: 'suspendDriver', driverId: driverId });
    }

    function bulkAction(action, driverIds) {
        sendToVelo({ action: action, driverIds: driverIds });
    }

    function exportDrivers(filters) {
        sendToVelo({ action: 'exportDrivers', filters: filters });
    }

    function openMessageModal(driverId) {
        sendToVelo({ action: 'openMessageModal', driverId: driverId });
    }

    function openAddDriverModal() {
        sendToVelo({ action: 'openAddDriverModal' });
    }

    function revealEmail(driverId) {
        sendToVelo({ action: 'revealEmail', driverId: driverId });
    }

    function ping() {
        sendToVelo({ action: 'ping', timestamp: Date.now() });
    }

    /* --- Connection health check --- */

    function verifyConnection() {
        if (connectionVerified) return;
        ping();
        setTimeout(function () {
            if (!connectionVerified) {
                console.warn('CONNECTION CHECK: No pong received from Velo within 3s');
            }
        }, 3000);
    }

    function setConnectionVerified() {
        connectionVerified = true;
    }

    function isConnectionVerified() {
        return connectionVerified;
    }

    /* --- Inbound message listener --- */

    function listen(handlers) {
        window.addEventListener('message', function (event) {
            if (!isValidOrigin(event)) return;
            var data = event.data;
            if (!validateMessageSchema(data)) return;
            if (!validateInboundMessage(data.action)) return;
            logMessageFlow('in', data.action, data);
            if (handlers[data.action]) {
                handlers[data.action](data);
            }
        });
    }

    return {
        sendToVelo: sendToVelo,
        listen: listen,
        verifyConnection: verifyConnection,
        setConnectionVerified: setConnectionVerified,
        isConnectionVerified: isConnectionVerified,
        getDrivers: getDrivers,
        getStats: getStats,
        getDriverDetail: getDriverDetail,
        verifyDriver: verifyDriver,
        suspendDriver: suspendDriver,
        bulkAction: bulkAction,
        exportDrivers: exportDrivers,
        openMessageModal: openMessageModal,
        openAddDriverModal: openAddDriverModal,
        revealEmail: revealEmail,
        ping: ping
    };
})();
