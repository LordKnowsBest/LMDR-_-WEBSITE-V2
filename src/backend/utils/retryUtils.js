/**
 * retryUtils.js
 * Shared utility for retrying operations.
 */

/**
 * Retries an async function with exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delayMs - Initial delay in ms (default: 1000)
 * @returns {Promise<any>} - Result of the operation
 */
export async function withRetry(operation, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);

            if (i < maxRetries - 1) {
                // Wait before retrying (exponential backoff)
                const waitTime = delayMs * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError;
}
