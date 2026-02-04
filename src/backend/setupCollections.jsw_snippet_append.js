
// ============================================================================
// CARRIER PAYMENTS SETUP
// Reference: Conductor/tracks/carrier_conversion_20260103/plan.md
// ============================================================================

const CARRIER_PAYMENTS_SCHEMA = {
    collectionName: 'CarrierPayments',
    displayName: 'Carrier Payments',
    fields: [
        { name: 'leadId', type: 'text', description: 'Reference to CarrierLeads' },
        { name: 'stripeSessionId', type: 'text', description: 'Stripe Checkout Session ID' },
        { name: 'amount', type: 'number', description: 'Payment amount' },
        { name: 'currency', type: 'text', description: 'Currency code (e.g., usd)' },
        { name: 'status', type: 'text', description: 'pending, completed, failed, refunded' },
        { name: 'paymentIntentId', type: 'text', description: 'Stripe Payment Intent ID' },
        { name: 'completedAt', type: 'date', description: 'Completion timestamp' },
        { name: 'carrierDot', type: 'text', description: 'Carrier DOT Number' }
    ],
    permissions: {
        read: 'Admin',
        create: 'Admin',
        update: 'Admin',
        delete: 'Admin'
    }
};

/**
 * Creates the CarrierPayments collection if it doesn't exist
 */
export async function setupCarrierPayments() {
    console.log('[SETUP] Setting up CarrierPayments...');
    const schema = CARRIER_PAYMENTS_SCHEMA;

    const { exists, error } = await checkCollectionExists(schema.collectionName);

    if (exists) {
        console.log(`[SETUP] ${schema.collectionName} collection exists.`);
        return { success: true, message: 'Collection exists', collectionName: schema.collectionName };
    }

    return {
        success: false,
        error: `${schema.collectionName} collection missing. Create manually.`,
        collectionName: schema.collectionName,
        schema: schema,
        instructions: generateCollectionInstructions(schema),
        indexRecommendations: [
            'Create index on: leadId',
            'Create index on: stripeSessionId'
        ]
    };
}
