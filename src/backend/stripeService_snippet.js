
/**
 * Update payment status (called by webhook)
 * @param {string} sessionId - Stripe Session ID
 * @param {string} status - New status (e.g. 'completed')
 * @param {Object} paymentData - Additional payment data (paymentIntentId, amount, currency)
 */
export async function updatePaymentStatus(sessionId, status, paymentData = {}) {
    try {
        let items = [];

        if (usesAirtable(CONFIG.carrierPaymentsKey)) {
            const filter = `{Stripe Session ID} = '${sessionId}'`;
            const result = await airtable.queryRecords(getAirtableTableName(CONFIG.carrierPaymentsKey), {
                filterByFormula: filter,
                maxRecords: 1
            });
            items = result.records || [];
        } else {
            const result = await wixData.query(CONFIG.carrierPaymentsCollection)
                .eq('stripeSessionId', sessionId)
                .limit(1)
                .find({ suppressAuth: true });
            items = result.items;
        }

        if (items.length === 0) {
            console.warn(`[StripeService] Payment record not found for session ${sessionId}`);
            return { success: false, error: 'Payment record not found' };
        }

        const payment = items[0];
        const updateFields = {
            ...payment,
            status: status,
            paymentIntentId: paymentData.paymentIntentId || payment.paymentIntentId,
            completedAt: new Date()
        };

        // Add amount/currency if provided and not present
        if (paymentData.amount) updateFields.amount = paymentData.amount;
        if (paymentData.currency) updateFields.currency = paymentData.currency;

        await updateData(CONFIG.carrierPaymentsKey, updateFields);
        console.log(`[StripeService] Updated payment status for session ${sessionId} to ${status}`);

        return { success: true };
    } catch (error) {
        console.error('[StripeService] updatePaymentStatus error:', error);
        return { success: false, error: error.message };
    }
}
