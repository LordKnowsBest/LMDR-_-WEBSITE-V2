# Pricing, Tiers & Stripe Configuration

> Auto-injected when editing Stripe, subscription, or billing service files.

## Subscription Tiers (Recruiter)

| Tier | Monthly | 6-Month Prepaid | Job Posts | Driver Views | Driver Search |
|------|---------|-----------------|-----------|--------------|---------------|
| Free | $0/mo | - | 1 | 0 | No |
| Pro | $299/mo | $249/mo ($1,494) | 5 | 25/month | Yes |
| Enterprise | $749/mo | $599/mo ($3,594) | Unlimited | Unlimited | Yes |

## VelocityMatch Full-Service Placement

| Stage | Amount | When Due |
|-------|--------|----------|
| Deposit | $100/driver | Upfront |
| On Hire | $600/driver | When driver is hired |
| Retention | $500/driver | After 14-day retention |
| **Total** | **$1,200/driver** | |

## Stripe Price IDs (Wix Secrets Manager)

| Secret Name | Description |
|-------------|-------------|
| `STRIPE_PRICE_PRO` | Pro monthly ($299/mo) |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly ($299/mo) |
| `STRIPE_PRICE_PRO_6MONTH` | Pro 6-month ($1,494 = $249/mo) |
| `STRIPE_PRICE_ENTERPRISE` | Enterprise monthly ($749/mo) |
| `STRIPE_PRICE_ENTERPRISE_6MONTH` | Enterprise 6-month ($3,594 = $599/mo) |
| `STRIPE_PRICE_PLACEMENT_DEPOSIT` | VelocityMatch deposit ($100/driver) |
| `STRIPE_PRICE_PLACEMENT_ONHIRE` | VelocityMatch on-hire ($600/driver) |
| `STRIPE_PRICE_PLACEMENT_RETENTION` | VelocityMatch 14-day retention ($500/driver) |

## Tier Enforcement Functions

- `canSearchDrivers(subscription)` - Returns `true` for Pro/Enterprise
- `canViewProfile(subscription)` - Returns `true` if quota available
- `recordProfileView(carrierDot, driverId)` - Deducts from monthly quota
