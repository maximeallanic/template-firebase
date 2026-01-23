# Mobile Deployment Setup Guide

This guide explains how to configure automatic deployment to the App Store and Play Store when a GitHub release is created.

## Overview

When you create a release using the "Create Release" workflow:
1. A version tag (e.g., `v1.2.0`) is created
2. The `mobile-release.yml` workflow is automatically triggered
3. Both iOS and Android apps are built and uploaded to their respective stores

## Required GitHub Secrets

### Android (Play Store)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore file | See "Android Keystore" section below |
| `ANDROID_KEYSTORE_PASSWORD` | Password for the keystore | The password you set when creating the keystore |
| `ANDROID_KEY_ALIAS` | Alias of the signing key | The alias you set when creating the key |
| `ANDROID_KEY_PASSWORD` | Password for the signing key | The password you set for the key |
| `FIREBASE_SERVICE_ACCOUNT` | Reuses existing Firebase service account | Already configured - just add Play Console permissions |

### iOS (App Store)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID | See "App Store Connect API Key" section below |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | App Store Connect Issuer ID | Same section |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | API Key content (base64) | Same section |
| `APPLE_ID` | Your Apple Developer account email | Your Apple ID email |
| `APPLE_TEAM_ID` | Apple Developer Team ID | See "Apple Team ID" section below |
| `ITC_TEAM_ID` | App Store Connect Team ID | Usually same as APPLE_TEAM_ID |
| `MATCH_GIT_URL` | Git repository URL for certificates | See "Fastlane Match" section below |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Base64-encoded Git credentials | See "Fastlane Match" section below |
| `MATCH_PASSWORD` | Encryption password for Match | A strong password you create |

---

## Android Setup

### 1. Create Android Keystore

If you don't have a release keystore yet:

```bash
keytool -genkey -v -keystore spicyvssweet-release.keystore \
  -alias spicyvssweet \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD
```

**IMPORTANT:** Keep this keystore safe! If you lose it, you cannot update your app on the Play Store.

### 2. Encode Keystore to Base64

```bash
base64 -i spicyvssweet-release.keystore | tr -d '\n' > keystore_base64.txt
```

Copy the content of `keystore_base64.txt` and add it as `ANDROID_KEYSTORE_BASE64` secret.

### 3. Grant Play Console Permissions to Existing Service Account

We reuse the existing Firebase service account. You just need to grant it Play Console permissions:

1. Enable **Google Play Android Developer API** in [Google Cloud Console](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)

2. Go to [Google Play Console](https://play.google.com/console) → **Users and Permissions**

3. Click **Invite new users**

4. Enter the service account email (found in your `FIREBASE_SERVICE_ACCOUNT` secret or in Google Cloud Console):
   ```
   your-service-account@your-project.iam.gserviceaccount.com
   ```

5. Grant these permissions:
   - ✅ View app information and download bulk reports
   - ✅ Release to production, exclude devices, and use Play App Signing
   - ✅ Release apps to testing tracks
   - ✅ Manage testing tracks and edit tester lists

6. Click **Invite user**

### 4. Add Android Secrets to GitHub

Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions** and add:

```
ANDROID_KEYSTORE_BASE64 = <content of keystore_base64.txt>
ANDROID_KEYSTORE_PASSWORD = YOUR_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS = spicyvssweet
ANDROID_KEY_PASSWORD = YOUR_KEY_PASSWORD
```

Note: `FIREBASE_SERVICE_ACCOUNT` is already configured and will be reused for Play Store uploads.

---

## iOS Setup

### 1. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to **Users and Access** > **Integrations** tab > **App Store Connect API**
3. Click **Generate API Key** (or **+** button)
4. Name: `CI/CD Key`
5. Access: **Admin** (or **App Manager** at minimum)
6. Click **Generate**
7. Note the **Key ID** and **Issuer ID**
8. Click **Download API Key** (you can only download once!)

### 2. Encode API Key to Base64

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' > api_key_base64.txt
```

### 3. Find Your Apple Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. In the top right, you'll see your Team ID in the format: `XXXXXXXXXX`
3. Or go to **Membership** to see your Team ID

### 4. Setup Fastlane Match

Match stores your certificates and provisioning profiles in a Git repository.

#### Create a Private Git Repository

1. Create a new **private** repository on GitHub (e.g., `spicyvssweet-certificates`)
2. This repo will store encrypted certificates

#### Generate Git Access Token

1. Go to GitHub > **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Generate a new token with `repo` scope
3. Create the authorization string:

```bash
echo -n "your-github-username:ghp_your_token_here" | base64
```

#### Initialize Match (run locally once)

```bash
cd ios/App
bundle install
bundle exec fastlane match init
```

When prompted:
- Storage mode: `git`
- URL: `https://github.com/your-username/spicyvssweet-certificates.git`

Then create the certificates:

```bash
# For App Store distribution
bundle exec fastlane match appstore
```

You'll be prompted to create an encryption password - save this as `MATCH_PASSWORD`.

### 5. Add iOS Secrets to GitHub

```
APP_STORE_CONNECT_API_KEY_ID = XXXXXXXXXX (the Key ID)
APP_STORE_CONNECT_API_KEY_ISSUER_ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (the Issuer ID)
APP_STORE_CONNECT_API_KEY_CONTENT = <content of api_key_base64.txt>
APPLE_ID = your-apple-id@email.com
APPLE_TEAM_ID = XXXXXXXXXX
ITC_TEAM_ID = XXXXXXXXXX (usually same as APPLE_TEAM_ID)
MATCH_GIT_URL = https://github.com/your-username/spicyvssweet-certificates.git
MATCH_GIT_BASIC_AUTHORIZATION = <base64 encoded username:token>
MATCH_PASSWORD = <your match encryption password>
```

---

## Testing the Setup

### Test Android Deployment

```bash
# Run manually from GitHub Actions
# Go to Actions > Mobile Store Release > Run workflow
# Select: platform=android, track=internal
```

### Test iOS Deployment

```bash
# Run manually from GitHub Actions
# Go to Actions > Mobile Store Release > Run workflow
# Select: platform=ios, track=internal
```

---

## Workflow Behavior

### On Tag Push (v*)

When you create a release with the "Create Release" workflow:
- **Android**: Uploaded to **Internal Testing** track
- **iOS**: Uploaded to **TestFlight**

### Manual Workflow Dispatch

You can manually trigger the workflow with different tracks:
- `internal`: TestFlight (iOS) / Internal Testing (Android)
- `beta`: External TestFlight (iOS) / Open Testing (Android)
- `production`: App Store Review (iOS) / Production (Android)

---

## Troubleshooting

### Android Issues

**"APK/AAB is not signed"**
- Verify `ANDROID_KEYSTORE_BASE64` is correctly encoded
- Check that keystore password and key alias are correct

**"Service account doesn't have access"**
- Ensure the service account has the correct permissions in Play Console
- Wait a few minutes after granting permissions (propagation delay)

**"Version code already exists"**
- The workflow uses `github.run_number` as version code
- If you've manually uploaded a build, the version code might conflict
- Solution: Cancel the old release in Play Console or reset your workflow run number

### iOS Issues

**"No signing certificate found"**
- Run `fastlane match appstore` locally to ensure certificates are created
- Check that `MATCH_GIT_URL` and credentials are correct

**"App Store Connect API Key invalid"**
- Verify the API key is base64-encoded correctly
- Check that the key hasn't been revoked

**"Provisioning profile doesn't match"**
- Run `fastlane match nuke appstore` and then `fastlane match appstore` to regenerate
- Ensure bundle identifier matches exactly: `com.spicyvssweet.app`

---

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate credentials** periodically
4. **Limit access** to the certificates repository
5. **Use separate keystores** for debug and release builds
6. **Backup your keystore** securely - losing it means you can't update your app

---

## Files Created/Modified

```
ios/App/
├── Gemfile              # Ruby dependencies
├── fastlane/
│   ├── Appfile          # App configuration
│   ├── Fastfile         # Fastlane lanes (build, deploy)
│   └── Matchfile        # Certificate management config

android/
├── Gemfile              # Ruby dependencies
├── fastlane/
│   ├── Appfile          # App configuration
│   └── Fastfile         # Fastlane lanes (build, deploy)

.github/workflows/
└── mobile-release.yml   # CI/CD workflow
```
