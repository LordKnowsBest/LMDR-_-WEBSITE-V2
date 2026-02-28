const fs = require('fs');

const stripeService = fs.readFileSync('src/backend/stripeService.jsw', 'utf8');
const httpFunctions = fs.readFileSync('src/backend/http-functions.js', 'utf8');

console.log("Analyzing Stripe Security Checkpoints...");

// Check 1: Webhook signature validation
const hasSignatureCheck = httpFunctions.includes('verifyStripeSignature(body, signature)');
console.log(`\nCheck 1: Webhook signature validation - ${hasSignatureCheck ? 'PASS' : 'FAIL'}`);

// Check 2: Webhook secret fetched securely
const hasWebhookSecretFetch = httpFunctions.includes("getSecret('STRIPE_WEBHOOK_SECRET')");
console.log(`Check 2: Webhook secret fetched securely - ${hasWebhookSecretFetch ? 'PASS' : 'FAIL'}`);

// Check 3: Idempotency check
const hasIdempotencyCheck = httpFunctions.includes('isEventProcessed(event.id)');
const hasStripeEventsKey = stripeService.includes("stripeEventsKey: 'stripeEvents'");
console.log(`Check 3: Idempotency check - ${hasIdempotencyCheck && hasStripeEventsKey ? 'PASS' : 'FAIL'}`);

// Check 4: Webhook failures return error
const failsOnInvalidSignature = httpFunctions.includes("return badRequest({ error: 'Invalid signature' });") &&
                               httpFunctions.includes("if (!verificationResult.success)");
console.log(`Check 4: Invalid signature returns error - ${failsOnInvalidSignature ? 'PASS' : 'FAIL'}`);

// Check 5: No JSON.parse before signature verification
const parseIndex = httpFunctions.indexOf('JSON.parse(body)');
const verifyIndex = httpFunctions.indexOf('verifyStripeSignature(body, signature)');
const noParseBeforeVerify = verifyIndex < parseIndex;
console.log(`Check 5: No JSON.parse before verification - ${noParseBeforeVerify ? 'PASS' : 'FAIL'}`);

// Bonus 1: Publishable key not used for sensitive operations
const publishableKeyUsedForSensitive = stripeService.includes('Authorization: `Bearer ${secrets.publishableKey}`') ||
                                       stripeService.includes("Authorization': `Bearer ${secrets.publishableKey}`");
console.log(`\nBonus 1: Publishable key not used for sensitive ops - ${!publishableKeyUsedForSensitive ? 'PASS' : 'FAIL'}`);

// Bonus 2: Secret key fetched securely
const secretKeyFetchedSecurely = stripeService.includes("getSecret('SECRET_KEY_STRIPE')");
console.log(`Bonus 2: Secret key fetched securely - ${secretKeyFetchedSecurely ? 'PASS' : 'FAIL'}`);

// Bonus 3: Subscription status changes from webhooks correctly update user access
const handleSubscriptionUpdated = httpFunctions.includes('upsertSubscription(subscription, subscription.customer)');
console.log(`Bonus 3: Webhooks update user access - ${handleSubscriptionUpdated ? 'PASS' : 'FAIL'}`);
