# Service Account Configuration for CI/CD

## Problem

Deployment fails with error:
```
Error: Request to https://firebaserules.googleapis.com/v1/projects/{{PROJECT_ID}}:test had HTTP Error: 403, The caller does not have permission
```

This means the service account doesn't have permissions to deploy Firestore rules.

## Solution: Add Required Permissions

### Step 1: Identify the Service Account

The service account is in the GitHub secret `FIREBASE_SERVICE_ACCOUNT`.

To see which service account is used:
```bash
# In GitHub Secrets, the JSON contains a "client_email" field
# It looks like: firebase-adminsdk-xxxxx@{{PROJECT_ID}}.iam.gserviceaccount.com
```

### Step 2: Add Roles via Google Cloud Console (Interface)

1. **Go to IAM:**
   ```
   https://console.cloud.google.com/iam-admin/iam?project={{PROJECT_ID}}
   ```

2. **Find the service account** (search for the service account email)

3. **Click the pencil (Edit)** on the right

4. **Add these roles:**
   - ✅ `Firebase Admin` (recommended - includes everything)

   OR these specific roles:
   - ✅ `Firebase Rules Admin`
   - ✅ `Cloud Functions Developer`
   - ✅ `Firebase Hosting Admin`
   - ✅ `Cloud Datastore Index Admin`
   - ✅ `Service Account User`
   - ✅ `Secret Manager Viewer`
   - ✅ `Secret Manager Secret Accessor`
   - ✅ `Cloud Scheduler Admin`

5. **Save**

### Step 3: Add Roles via gcloud CLI (Alternative)

```bash
# Replace SERVICE_ACCOUNT_EMAIL with your service account email
SERVICE_ACCOUNT_EMAIL="firebase-adminsdk-xxxxx@{{PROJECT_ID}}.iam.gserviceaccount.com"
PROJECT_ID="{{PROJECT_ID}}"

# Option 1: Add Firebase Admin role (simple)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebase.admin"

# Option 2: Add specific roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebaserules.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebasehosting.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.indexAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.viewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudscheduler.admin"
```

### Step 4: Create a NEW Service Account (If Needed)

If you prefer to create a new service account:

```bash
PROJECT_ID="{{PROJECT_ID}}"
SERVICE_ACCOUNT_NAME="github-actions-deploy"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create the service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="GitHub Actions Deploy" \
  --project=$PROJECT_ID

# Add Firebase Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/firebase.admin"

# Create JSON key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=$SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID

echo "✅ Service account created!"
echo "📄 JSON key saved to: ~/github-actions-key.json"
echo ""
echo "📋 Copy the content of this file to GitHub Secret:"
cat ~/github-actions-key.json
```

### Step 5: Update GitHub Secret

1. **Copy the JSON content** (if you created a new service account)

2. **Go to GitHub:**
   ```
   https://github.com/[OWNER]/[REPO]/settings/secrets/actions
   ```

3. **Edit** `FIREBASE_SERVICE_ACCOUNT`

4. **Paste** the complete new JSON

5. **Save**

### Step 6: Test Deployment

```bash
# Push a commit to trigger the workflow
git commit --allow-empty -m "test: Trigger CI/CD after service account permissions update"
git push origin master
```

## Verify Permissions

To verify current service account permissions:

```bash
SERVICE_ACCOUNT_EMAIL="firebase-adminsdk-xxxxx@{{PROJECT_ID}}.iam.gserviceaccount.com"
PROJECT_ID="{{PROJECT_ID}}"

gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --format="table(bindings.role)"
```

## Required Roles (Summary)

| Role | Description | Required For |
|------|-------------|--------------|
| `roles/firebase.admin` | Full Firebase access | Everything (recommended) |
| `roles/firebaserules.admin` | Manage Firebase rules | Firestore rules |
| `roles/cloudfunctions.developer` | Deploy functions | Cloud Functions |
| `roles/firebasehosting.admin` | Manage hosting | Firebase Hosting |
| `roles/datastore.indexAdmin` | Manage indexes | Firestore indexes |
| `roles/iam.serviceAccountUser` | Use service account | All operations |
| `roles/secretmanager.viewer` | View secrets | Secret Manager |
| `roles/secretmanager.secretAccessor` | Access secret values | Secret Manager |
| `roles/cloudscheduler.admin` | Manage scheduled jobs | Scheduled Functions |

## Troubleshooting

### Error 403 persists
- Wait 1-2 minutes after adding roles (propagation)
- Verify you're modifying the CORRECT service account
- Check in GitHub that the secret contains the correct JSON

### How to see which service account is used
```bash
# In GitHub Actions logs, look for:
# "Authenticating with..."
# The service account email will be visible
```

### Test locally
```bash
# Use the service account locally
export GOOGLE_APPLICATION_CREDENTIALS=~/github-actions-key.json
firebase deploy --project {{PROJECT_ID}}
```

---

**Security Note:** The service account with `roles/firebase.admin` has many permissions. This is normal for a CI/CD deployment account, but keep the JSON secret secured in GitHub Secrets only.
