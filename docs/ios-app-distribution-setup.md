# iOS Firebase App Distribution Setup Guide

This guide explains how to configure iOS builds with Firebase App Distribution for PR previews.

## Prerequisites

- Apple Developer Account (paid membership required)
- Access to Firebase Console
- Admin access to GitHub repository settings

## Step 1: Create an App ID in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** to create a new identifier
4. Select **App IDs** → **App**
5. Fill in:
   - **Description**: `Spicy vs Sweet`
   - **Bundle ID**: `com.spicyvssweet.app` (Explicit)
6. Enable required capabilities (if any)
7. Click **Continue** → **Register**

## Step 2: Create a Distribution Certificate

### Option A: Using Keychain Access (macOS)

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
3. Fill in:
   - **User Email Address**: Your Apple ID email
   - **Common Name**: Your name
   - **CA Email Address**: Leave empty
   - **Request is**: Saved to disk
4. Save the `.certSigningRequest` file

### Option B: Using Command Line

```bash
# Generate a private key and CSR
openssl genrsa -out distribution.key 2048
openssl req -new -key distribution.key -out distribution.csr \
  -subj "/emailAddress=your@email.com/CN=Your Name/C=FR"
```

### Upload CSR to Apple Developer Portal

1. Go to **Certificates, Identifiers & Profiles** → **Certificates**
2. Click **+** to create a new certificate
3. Select **Apple Distribution** (for Ad-Hoc and App Store)
4. Upload your `.certSigningRequest` file
5. Download the generated `.cer` certificate

### Convert to .p12 Format

```bash
# Convert .cer to .pem
openssl x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM

# If you used Keychain Access, export from Keychain as .p12
# If you used command line:
openssl pkcs12 -export -out distribution.p12 \
  -inkey distribution.key \
  -in distribution.pem \
  -password pass:YOUR_PASSWORD
```

**Or via Keychain Access:**
1. Double-click the downloaded `.cer` to install it
2. Open **Keychain Access**
3. Find the certificate under **My Certificates**
4. Right-click → **Export** → Save as `.p12`
5. Set a strong password (you'll need this for `IOS_P12_PASSWORD`)

## Step 3: Register Test Devices (for Ad-Hoc)

1. Go to **Devices** in Apple Developer Portal
2. Click **+** to register devices
3. Add each tester's device UDID

**To get a device UDID:**
- Connect iPhone to Mac → Open **Finder** → Click on iPhone → Click on device info until UDID appears
- Or use: https://udid.tech on the device

## Step 4: Create an Ad-Hoc Provisioning Profile

1. Go to **Profiles** in Apple Developer Portal
2. Click **+** to create a new profile
3. Select **Ad Hoc** under Distribution
4. Select your App ID (`com.spicyvssweet.app`)
5. Select your Distribution Certificate
6. Select the devices for testing
7. Name it: `Spicy vs Sweet Ad Hoc`
8. Download the `.mobileprovision` file

## Step 5: Get Firebase iOS App ID

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Under **Your apps**, find the iOS app
5. Copy the **App ID** (format: `1:123456789:ios:abcdef123456`)

If you don't have an iOS app registered:
1. Click **Add app** → iOS
2. Enter Bundle ID: `com.spicyvssweet.app`
3. Download `GoogleService-Info.plist` (already in project)
4. Copy the App ID

## Step 6: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

### Encode Files to Base64

```bash
# On macOS
base64 -i distribution.p12 | tr -d '\n' | pbcopy
# Paste into IOS_P12_BASE64

base64 -i SpicyVsSweet_AdHoc.mobileprovision | tr -d '\n' | pbcopy
# Paste into IOS_PROVISIONING_PROFILE_BASE64
```

```bash
# On Linux
base64 -w 0 distribution.p12
base64 -w 0 SpicyVsSweet_AdHoc.mobileprovision
```

### Required Secrets

| Secret Name | How to Get It |
|-------------|---------------|
| `IOS_P12_BASE64` | Base64-encoded `.p12` certificate (see above) |
| `IOS_P12_PASSWORD` | Password you set when exporting the .p12 |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded `.mobileprovision` file |
| `IOS_CODE_SIGN_IDENTITY` | Usually `Apple Distribution: Your Name (TEAM_ID)` - find it in Keychain Access under the certificate name |
| `IOS_TEAM_ID` | Your 10-character Team ID from [Apple Developer Membership](https://developer.apple.com/account/#/membership) |
| `FIREBASE_IOS_APP_ID` | From Firebase Console (e.g., `1:235167916448:ios:abc123`) |

### Finding Your Code Sign Identity

```bash
# List all valid signing identities
security find-identity -v -p codesigning

# Output will look like:
# 1) ABC123... "Apple Distribution: Your Name (TEAMID)"
#    Use the quoted string as IOS_CODE_SIGN_IDENTITY
```

## Step 7: Set Up Firebase App Distribution Testers

1. Go to Firebase Console → **App Distribution**
2. Select your iOS app
3. Go to **Testers & Groups**
4. Create a group named `testers`
5. Add tester email addresses
6. Testers will receive an invitation email

**Important:** Testers must:
1. Accept the invitation email
2. Register their device UDID via the Firebase App Tester app
3. You must add their UDID to Apple Developer Portal (Step 3)
4. Regenerate the provisioning profile with the new devices (Step 4)
5. Update `IOS_PROVISIONING_PROFILE_BASE64` secret

## Step 8: Verify Configuration

Create a test PR to trigger the workflow. Check the workflow logs for:

1. ✅ "iOS signing certificates are configured"
2. ✅ Successful archive creation
3. ✅ Successful IPA export
4. ✅ Upload to Firebase App Distribution

## Troubleshooting

### "No signing certificate" error
- Verify the .p12 is correctly base64-encoded (no newlines)
- Check the password is correct
- Ensure the certificate hasn't expired

### "Provisioning profile doesn't match" error
- Verify Bundle ID matches exactly: `com.spicyvssweet.app`
- Regenerate profile with the correct certificate
- Make sure the certificate in the profile matches the .p12

### "Device not registered" error
- Add the device UDID to Apple Developer Portal
- Regenerate the provisioning profile
- Update the `IOS_PROVISIONING_PROFILE_BASE64` secret

### Build succeeds but testers can't install
- Verify tester's device UDID is in the provisioning profile
- Make sure tester accepted the Firebase invitation
- Check that tester is in the `testers` group

## Security Notes

- Never commit certificates or provisioning profiles to the repository
- Rotate certificates before they expire (annually)
- Remove testers who no longer need access
- Use separate certificates for development and production

## Certificate Expiration

Apple Distribution certificates expire after **1 year**. Set a reminder to:
1. Generate a new certificate before expiration
2. Update the provisioning profile
3. Update GitHub secrets

## Quick Reference: All Secrets

```
IOS_P12_BASE64=<base64-encoded .p12 file>
IOS_P12_PASSWORD=<password for .p12>
IOS_PROVISIONING_PROFILE_BASE64=<base64-encoded .mobileprovision>
IOS_CODE_SIGN_IDENTITY=Apple Distribution: Your Name (TEAMID)
IOS_TEAM_ID=ABCD123456
FIREBASE_IOS_APP_ID=1:235167916448:ios:xxxxxxxxxxxx
```
