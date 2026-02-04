
// ============================================================================
// GET LEAD DETAILS (for checkout)
// ============================================================================

/**
 * Get lead details for checkout page
 * @param {string} leadId - The lead ID
 * @returns {Promise<Object>} - The lead details
 */
export async function getLeadDetails(leadId) {
    try {
        const statusResult = await getLeadStatus(leadId);
        if (!statusResult.success || !statusResult.lead) {
            return null;
        }

        // Reuse getLeadStatus basic data but we need full details
        // Since getLeadStatus already fetches from DB, let's just use that logic
        // but return more fields or just fetch again here for clarity

        // For now, let's just fetch it freshly as getLeadStatus returns a limited subset

        const collectionKey = 'carrierStaffingRequests';
        let lead = null;

        if (usesAirtable(collectionKey)) {
            lead = await airtable.getRecord(collectionKey, leadId);
            if (lead && lead.error) return null;
        } else {
            lead = await wixData.get(CONFIG.leadsCollection, leadId, { suppressAuth: true });
        }

        if (!lead) return null;

        // Map to standardized format
        return {
            _id: lead._id,
            companyName: lead.company_name,
            contactName: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            driversNeeded: lead.drivers_needed,
            staffingType: lead.staffing_type
        };

    } catch (error) {
        console.error('❌ Error getting lead details:', error);
        throw error;
    }
}
