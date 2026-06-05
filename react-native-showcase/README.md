# WDK React Native Showcase

This application demonstrates the power and flexibility of the **Wallet Development Kit (WDK)** for React Native. It serves as a comprehensive reference implementation for building high-performance, non-custodial crypto wallets.

The project highlights two critical components of the WDK ecosystem:
1.  **`@tetherto/wdk-react-native-core`**: The state management and business logic layer.
2.  **`@tetherto/wdk-worklet-bundler`**: A build tool that compiles wallet logic into secure, high-performance worklets.

## 🚀 Overview

Designed as a "kitchen sink" for WDK capabilities, this app allows developers to test wallet functions in isolation. It uses a modular architecture where each feature (Balance, Transfer, Signing) is self-contained, making it easy to copy-paste patterns into your own production apps.

## ✨ Key Features

### 🔐 Wallet Management
- **Biometric Security**: Create and access wallets secured by device biometrics (FaceID/TouchID).
- **Multi-Wallet Support**: Create, import, and switch between multiple wallet identities (e.g., different users or test accounts).
- **Mnemonic Handling**: Securely import and reveal recovery phrases.
- **Temporary Wallets**: Generate disposable wallets for testing flows without persistence.

### 💰 Asset & Balance Tracking
- **Unified Interface**: Fetch native (ETH, BTC) and token (ERC20, etc.) balances with a single hook.
- **Smart Caching**: Powered by **TanStack Query** for efficient caching, background updates, and offline support.
- **Multi-Chain**: Seamlessly handle assets across Ethereum, Polygon, Bitcoin, and more.

### 💸 Transactions & Signing
- **Send Funds**: robust transfer logic for native coins and tokens.
- **Message Signing**: Sign standard messages (EIP-191) to prove identity.
- **Typed Data (EIP-712)**: Sign complex structured data for interactions with DAOs and protocols.

## 🛠 Project Architecture

The project is built with **Expo** and follows a feature-first directory structure:

```
src/
├── app/
│   └── features/       # Self-contained feature modules
│       ├── wallet/     # Wallet logic (Balance, Transfer, Mgmt)
│       └── config/     # Configuration viewers
├── components/         # Shared UI (ActionCard, ConsoleOutput)
├── config/             # Chain & Token definitions (AssetConfig)
└── entities/           # Domain entities (AppAsset)
```

### The Worklet Model
This project utilizes the **WDK Worklet Bundler**. Wallet cryptographic operations (hashing, signing) are compiled into a separate JavaScript bundle that runs on a background thread (Worklet). This ensures:
- **UI Smoothness**: Heavy crypto math never blocks the main thread.
- **Security**: Sensitive key operations are isolated from the main UI context.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1.  **Install dependencies:**
    ```sh
    npm install
    ```

2. **Create config file:**
    Declare necessary WDK modules in `wdk.config.js` to be bundled.

3.  **Generate the Worklet Bundle:**
    Before running the app, you must bundle the worklet code:
    ```sh
    npx wdk-worklet-bundler generate
    ```
4.  **Import the generated bundle:**
    Import the bundle in `_layout.tsx` and pass it into `WdkAppProvider`.

### Running the App

```sh
# iOS
npm run ios

# Android
npm run android
```

## 📦 Core Dependencies

- **`@tetherto/wdk-react-native-core`**: Core hooks and logic.
- **`@tetherto/wdk-worklet-bundler`**: CLI for bundling worklet code.

## 📄 License

Apache-2.0
