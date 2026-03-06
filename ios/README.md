# Coffee@CU — iOS App

Native iOS app for the Coffee@CU community platform.
Built with SwiftUI targeting **iOS 26+** with **Liquid Glass** components throughout.

## Requirements

- Xcode 16+
- iOS 26 SDK
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)
- Apple Developer account (for push notifications + device testing)

## Setup

### 1. Generate the Xcode project

```bash
cd ios/
xcodegen generate
open CoffeeAtCU.xcodeproj
```

### 2. Configure Supabase credentials

Edit `CoffeeAtCU/Config.swift` and fill in your project values:

```swift
static let supabaseURL    = "https://YOUR_PROJECT.supabase.co"
static let supabaseAnonKey = "YOUR_ANON_KEY"
```

These are found in your Supabase dashboard → **Settings → API**.

### 3. Add Supabase Swift SDK

The `project.yml` declares the dependency. XcodeGen + Xcode will resolve it automatically via Swift Package Manager on first build.

### 4. Push Notifications (APNs)

#### Apple Developer Portal
1. Go to **Certificates, Identifiers & Profiles → Keys**
2. Create a new key with **Apple Push Notifications service (APNs)** enabled
3. Download the `.p8` file — store it securely, you can only download it once
4. Note your **Team ID** (top-right of developer portal) and **Key ID** (listed on the key)

#### Enable capability in Xcode
1. Select the `CoffeeAtCU` target → **Signing & Capabilities**
2. Add **Push Notifications**
3. Add **Background Modes** → check **Remote notifications**

#### Environment variables (backend)
Add these to your `.env.local` (and Vercel/Railway/etc. project settings):

```
APNS_TEAM_ID=XXXXXXXXXX
APNS_KEY_ID=XXXXXXXXXX
APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APNS_BUNDLE_ID=edu.columbia.coffeeatcu
```

The `APNS_PRIVATE_KEY` is the full contents of your `.p8` file, with literal newlines replaced by `\n`.

#### Database migration
Run migration `009_device_tokens.sql` on your Supabase project:

```bash
supabase db push
# or apply manually in Supabase SQL editor
```

### 5. Build & run

Select a physical device or iOS 26 simulator and press **⌘R**.

---

## Architecture

```
CoffeeAtCU/
├── CoffeeAtCUApp.swift          # @main entry, auth gate, tab structure
├── AppDelegate.swift            # APNs token registration + background push
├── Config.swift                 # Supabase URL, constants
│
├── Models/
│   ├── Profile.swift            # Profile + QAResponse + FilterState
│   └── Meeting.swift            # Meeting (received request) + payloads
│
├── Services/
│   ├── SupabaseClient.swift     # Shared SupabaseClient singleton
│   ├── AuthService.swift        # Email/password auth, domain validation
│   ├── ProfileService.swift     # Browse, fetch, upload, save
│   ├── MeetingService.swift     # Send requests, fetch inbox
│   └── NotificationService.swift # APNs registration, token upload, routing
│
├── Components/                  # Reusable Liquid Glass UI primitives
│   ├── GlassCard.swift          # .glassEffect() wrapper card
│   ├── PrimaryButton.swift      # Columbia-blue + ghost glass buttons
│   ├── ProfilePhoto.swift       # AsyncImage with initials fallback
│   ├── SchoolBadge.swift        # Colour-coded school chips
│   └── SocialLinks.swift        # Scrollable glass social link row
│
├── Auth/
│   ├── AuthViewModel.swift
│   └── AuthView.swift           # Columbia blue gradient + glass login card
│
├── Feed/
│   ├── FeedViewModel.swift
│   ├── ProfileCardView.swift    # Glass grid tile
│   ├── FilterSheetView.swift    # Bottom sheet (school / year / major / club)
│   └── FeedView.swift           # Two-column lazy grid with search
│
├── ProfileDetail/
│   ├── ProfileDetailView.swift  # Full profile sheet with glass section cards
│   └── CoffeeRequestView.swift  # Message composer, 500-char limit
│
├── Notifications/
│   ├── NotificationsViewModel.swift
│   ├── NotificationInboxView.swift     # List of received requests
│   └── CoffeeRequestDetailView.swift   # Sender profile + message + "Open in Mail"
│
└── MyProfile/
    ├── MyProfileViewModel.swift
    └── MyProfileView.swift      # View + edit own profile, photo upload
```

## Liquid Glass usage

This app targets iOS 26 and uses Apple's Liquid Glass design language:

| Component | API used |
|---|---|
| Profile cards (feed) | `.glassEffect(.regular, in: RoundedRectangle(...))` |
| Login card | `.glassEffect(.regular, in: RoundedRectangle(...))` |
| Section cards (profile detail) | `GlassCard` wrapper component |
| Social link chips | `.glassEffect(.regular, in: Capsule())` |
| Ghost buttons | `.glassEffect(.regular, in: Capsule())` |
| Tab bar | Automatic — iOS 26 `TabView` |
| Navigation bar | Automatic — iOS 26 |
| Filter bottom sheet | `.presentationBackground(.regularMaterial)` |

## Notification flow

```
User taps "Send" in CoffeeRequestView
         ↓
POST /api/coffee-request  (existing Next.js route)
         ↓
attempt_coffee_request() PostgreSQL function  (atomic: rate limit, dedup, blacklist)
         ↓ ok
Send email via Resend  +  SMS via Twilio (if phone on file)
         ↓
Look up receiver's APNs token in device_tokens table
         ↓
sendAPNsPush() → Apple APNs HTTP/2 API
         ↓
iOS delivers banner: "Alex Chen wants to grab coffee ☕"
         ↓
User taps notification → CoffeeRequestDetailView
         ↓
"Open in Mail" → iOS mail app picker (Mail / Gmail / Outlook / Spark)
         ↓
User replies from their email app
```

## Missing / TODO

- [ ] Onboarding flow (multi-step: photo → basics → Q&A → socials → publish)
- [ ] Profile photo picker polish (crop, preview before upload)
- [ ] Club / major multi-select pickers (currently free-text)
- [ ] iPad layout
- [ ] Widget (upcoming coffee requests)
- [ ] App Store assets (icon, screenshots)
- [ ] Haptics on send
- [ ] Read receipts in inbox
