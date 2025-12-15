# Stripe Configuration for Local Development

## Prerequisites
- Stripe account (free for testing)
- Stripe CLI installed ✅

## Configuration Steps

### 1. Login to Stripe CLI
```bash
stripe login
```
This command opens a browser to authenticate with your Stripe account.

### 2. Get Your Test API Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Add it to `functions/.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   ```

### 3. Configure Local Webhooks

#### Option A: With Stripe CLI (Recommended)
```bash
# Start webhook forwarding
stripe listen --forward-to http://localhost:5001/spicy-vs-sweety/us-central1/stripeWebhook
```

This command will:
- Listen to Stripe events
- Forward them to your local function
- Display a webhook secret (starts with `whsec_...`)

Copy this secret to `functions/.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

#### Option B: Test Without Webhooks
To test only payments without webhooks, leave `STRIPE_WEBHOOK_SECRET` empty in `.env.local`.

### 4. Test a Payment

1. Start Firebase emulators:
   ```bash
   firebase emulators:start
   ```

2. Open the application: http://localhost:5173/

3. Sign in and click "Upgrade to Pro"

4. Use a Stripe test card:
   - Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

### 5. Test Webhooks

With Stripe CLI listening, you can simulate events:

```bash
# Simulate a successful payment
stripe trigger checkout.session.completed

# Simulate a subscription update
stripe trigger customer.subscription.updated

# Simulate a cancellation
stripe trigger customer.subscription.deleted
```

## Handled Stripe Events

The application handles the following events:

- ✅ `checkout.session.completed` - Activates Pro subscription (250 analyses/month)
- ✅ `customer.subscription.updated` - Updates subscription status
- ✅ `customer.subscription.deleted` - Deactivates subscription (back to 5 analyses/month)

## Troubleshooting

### Webhooks Not Working
1. Verify `stripe listen` is running
2. Check webhook secret is correct in `functions/.env.local`
3. Check Functions emulator logs

### API Key Not Working
1. Make sure you're using the **test** key (starts with `sk_test_`)
2. Verify the key is in `functions/.env.local`
3. Restart Firebase emulators after modifying `.env.local`

## Production Deployment

For production deployment:

1. Configure **live** Stripe keys (start with `sk_live_`)
2. Set up webhooks in Stripe Dashboard:
   - URL: `https://us-central1-spicy-vs-sweety.cloudfunctions.net/stripeWebhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Use Firebase Functions config to store secrets:
   ```bash
   firebase functions:config:set stripe.secret_key="sk_live_..."
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```
