# Sovereign Escrow — Adım adım kılavuz (TR)

Bu belge **şeffaf** olacak şekilde yazıldı: önce sözleşmeleri zincire deploy edersiniz, sonra cüzdanı yapılandırırsınız, sonra uçtan uca bir OTC takasını iki taraf birlikte yürütürsünüz.

> **Önemli:** Sovereign Wallet şu an **mainnet** EVM ağlarını kullanır (Ethereum, Polygon, Arbitrum, BSC). Deploy ve testler **gerçek token** içerir; küçük miktarlarla başlayın.

---

## İçindekiler

1. [Ne deploy ediliyor?](#1-ne-deploy-ediliyor)
2. [Gereksinimler](#2-gereksinimler)
3. [Deploy cüzdanı hazırlığı](#3-deploy-cüzdanı-hazırlığı)
4. [Foundry kurulumu](#4-foundry-kurulumu)
5. [Sözleşmeleri test etme](#5-sözleşmeleri-test-etme)
6. [Ağ ağ deploy (4 EVM)](#6-ağ-ağ-deploy-4-evm)
7. [escrow.json yapılandırması](#7-escrowjson-yapılandırması)
8. [Extension derleme ve Chrome’a yükleme](#8-extension-derleme-ve-chromea-yükleme)
9. [Kullanıcı akışı: OTC deal oluşturma](#9-kullanıcı-akışı-otc-deal-oluşturma)
10. [Karşı taraf: deal’e katılma](#10-karşı-taraf-deale-katılma)
11. [Sorun giderme](#11-sorun-giderme)

---

## 1. Ne deploy ediliyor?

Her EVM ağında **iki** sözleşme yayınlarsınız:

| Sözleşme | Görevi | Deploy sonrası sizin kontrolünüz |
|----------|--------|----------------------------------|
| **DualAssetEscrowFactory** | Her takas için yeni `DualAssetDealEscrow` oluşturur | Sadece `createOtcDeal` çağrısı; mevcut deal bakiyelerine erişemez |
| **EscrowRegistry** | Resmi Factory adresini kaydeder (`factory` **değiştirilemez**) | Kullanıcı fonlarını çekemez |

Her **takas** = Factory’nin oluşturduğu **yeni bir deal kontrat adresi**. Tek global deposit adresi yoktur.

**Protokol ücreti:** Deal oluşturulurken `feeBps` + `feeRecipient` (cüzdanda `escrow.json` → `protocolFeeBps` / `protocolFeeRecipient`). Ücret, settle anında USDT’den kesilir.

---

## 2. Gereksinimler

| Araç | Ne için |
|------|---------|
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | `forge test`, `forge script` ile deploy |
| [Node.js](https://nodejs.org/) 18+ | Extension build (`npm run build:prod`) |
| Google Chrome | Extension yükleme |
| **Deploy cüzdanı** | Sadece deploy; günlük cüzdanınız olmasın |
| **Gas** | Her ağda native coin (aşağıdaki tablo) |

### Ağ başına gas ve USDT (mainnet)

| Ağ (`chainKey`) | Native gas | USDT kontratı | USDT decimals |
|-----------------|------------|---------------|---------------|
| `ethereum` | ETH | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | **6** |
| `polygon` | MATIC | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | **6** |
| `arbitrum` | ETH | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | **6** |
| `bsc` | BNB | `0x55d398326f99059fF775485246999027B3197955` | **18** |

RPC (cüzdan zaten kullanıyor): `https://eth.drpc.org`, `polygon.drpc.org`, `arbitrum.drpc.org`, `bsc.drpc.org`

---

## 3. Deploy cüzdanı hazırlığı

1. Yeni bir seed oluşturun (**sadece deploy** için).
2. Her deploy edeceğiniz ağa **az miktarda** native coin gönderin (ör. BSC’de ~0.01–0.05 BNB yeterli olabilir; ağ yoğunluğuna göre artırın).
3. Private key’i **asla** repoya commit etmeyin.
4. Deploy bittikten sonra bu seed’i kaybetmek **mevcut deal’leri etkilemez**; yeni Factory için yeni deploy gerekir.

---

## 4. Foundry kurulumu

**Windows (PowerShell):**

```powershell
# Foundry resmi kurulum: https://book.getfoundry.sh/getting-started/installation
# Kurulumdan sonra:
forge --version
```

**Proje bağımlılığı:**

```powershell
cd d:\Downloads\sovereign-wallet\contracts
forge install foundry-rs/forge-std --no-commit
```

---

## 5. Sözleşmeleri test etme

Deploy öncesi yerelde test çalıştırın:

```powershell
cd d:\Downloads\sovereign-wallet\contracts
forge test -vv
```

Tüm testler yeşil olmalı. Kırmızı varsa deploy’a geçmeyin.

---

## 6. Ağ ağ deploy (4 EVM)

Script: `contracts/script/DeployDual.s.sol`

### `.env` (lokal — repoya gitmez)

1. `contracts/.env.example` → `.env` kopyalayın.
2. **PRIVATE_KEY** veya **MNEMONIC** (+ `MNEMONIC_INDEX`, genelde `0`) yazın.
3. Deploy:

```powershell
cd d:\Downloads\sovereign-wallet\contracts
$env:Path = "$env:USERPROFILE\.foundry\bin;" + $env:Path
.\tools\Deploy-Dual.ps1 -Network bsc
```

`.env` yalnızca sizin diskte kalır (`.gitignore`). **Commit / push etmeyin.**

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `PRIVATE_KEY` veya `MNEMONIC` | Biri | Deploy cüzdanı |
| `USDT_ADDRESS` | Hayır* | *Script ağa göre doldurabilir |
| `FEE_RECIPIENT` | Hayır | Opsiyonel |

İsteğe bağlı şifreli dosya: `secrets.enc` — bkz. `contracts/secrets.enc.README.txt`

### Örnek: Polygon

```powershell
$env:USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"

forge script script/DeployDual.s.sol:DeployDualEscrow `
  --rpc-url https://polygon.drpc.org `
  --broadcast `
  -vvvv
```

### Örnek: Ethereum

```powershell
$env:USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

forge script script/DeployDual.s.sol:DeployDualEscrow `
  --rpc-url https://eth.drpc.org `
  --broadcast `
  -vvvv
```

### Örnek: Arbitrum

```powershell
$env:USDT_ADDRESS = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"

forge script script/DeployDual.s.sol:DeployDualEscrow `
  --rpc-url https://arbitrum.drpc.org `
  --broadcast `
  -vvvv
```

### Deploy çıktısını kaydedin

Terminalde şuna benzer satırlar görürsünüz:

```
DualFactory 0x...
Registry 0x...
USDT 0x...
```

**Her ağ için bir tablo doldurun:**

| Ağ | DualFactory | Registry |
|----|-------------|----------|
| ethereum | | |
| polygon | | |
| arbitrum | | |
| bsc | `0x70648Cc55D6e587967380cA481BBDe1dc79bFfE0` | `0x187D951ed96b6cB8734A2eEe0d91C0cd24eD17fb` |

Adresleri [BscScan](https://bscscan.com) / [Polygonscan](https://polygonscan.com) vb. üzerinde doğrulayın: “Contract creation” transaction.

> **İsteğe bağlı:** Etherscan/Polygonscan API ile `forge verify-contract` ile kaynak kodu doğrulayabilirsiniz (kullanıcı güveni için önerilir).

---

## 7. escrow.json yapılandırması

Dosya: `wdk-extension/public/escrow.json`

Deploy sonrası **sıfır olmayan** adresleri yapıştırın:

```json
{
  "defaultNetwork": "bsc",
  "protocolFeeBps": 50,
  "protocolFeeRecipient": "0xSIZIN_UCRET_CUZDANI",
  "networks": {
    "ethereum": {
      "factory": "0xFABRIKA_ETHEREUM",
      "registry": "0xREGISTRY_ETHEREUM"
    },
    "polygon": {
      "factory": "0xFABRIKA_POLYGON",
      "registry": "0xREGISTRY_POLYGON"
    },
    "arbitrum": {
      "factory": "0xFABRIKA_ARBITRUM",
      "registry": "0xREGISTRY_ARBITRUM"
    },
    "bsc": {
      "factory": "0xFABRIKA_BSC",
      "registry": "0xREGISTRY_BSC"
    }
  },
  "comingSoon": ["bitcoin", "solana"]
}
```

| Alan | Anlamı |
|------|--------|
| `defaultNetwork` | Escrow sayfası açılınca seçili ağ |
| `protocolFeeBps` | 50 = %0,5 (10000 = %100) |
| `protocolFeeRecipient` | Settle’da USDT ücretinin gideceği adres |
| `networks.*.factory` | **Zorunlu** — UI `createOtcDeal` buraya gönderir |
| `networks.*.registry` | Kayıt / gelecekte allowlist için; şimdilik dosyada tutulur |

`0x000…000` kaldığı sürece o ağda UI **“Factory not deployed”** der.

---

## 8. Extension derleme ve Chrome’a yükleme

```powershell
cd d:\Downloads\sovereign-wallet\wdk-extension
npm install
npm run build:prod
```

1. Chrome → `chrome://extensions`
2. **Geliştirici modu** açık
3. **Paketlenmemiş öğe yükle** → `wdk-extension/dist` klasörü
4. Extension ikonu → cüzdan oluştur / kilidi aç
5. **Ayarlar → Sovereign Escrow** (veya `chrome-extension://…/escrow/index.html`)

Escrow arayüzünde yalnızca **Create** ve **Join** sekmeleri vardır (Foundry/deploy adımları cüzdanda yok; bu kılavuzda ve [ESCROW.md](./ESCROW.md) içinde).

Seçtiğiniz ağda **Live on … · factory 0x…** satırı görünmeli (BSC için yukarıdaki adresler). Görünmüyorsa: `chrome://extensions` → uzantıyı **Yenile**, Escrow sekmesini kapatıp tekrar açın; `escrow.json` + `npm run build:prod` kontrol edin.

---

## 9. Kullanıcı akışı: OTC deal oluşturma

**Senaryo:** Alıcı USDT verir, satıcı BSC’de bir meme token verir.

### Adım 9.1 — Ağ ve rol

1. Escrow → **Network:** `bsc` (veya anlaştığınız ağ)
2. **Create OTC** sekmesi
3. **Your role:** Buyer veya Seller
4. **Counterparty:** Karşı tarafın `0x` adresi (Telegram’da paylaşılan)

### Adım 9.2 — Miktarlar

| Alan | Örnek |
|------|--------|
| USDT amount | `100` |
| Token contract | Meme token BEP-20 adresi |
| Token amount | `1000000` |
| Token decimals | Token’ın `decimals()` değeri (çoğu meme **18**, USDT BSC’de **18**) |
| Funding window | İki tarafın yatırması için süre (saat) |

### Adım 9.3 — Zincirde oluştur

1. **Create OTC deal** → cüzdan işlemi onaylar
2. Explorer’da transaction → **OtcDealCreated** event’inden **`deal`** adresini kopyalayın
3. Bu adresi karşı tarafa gönderin (Join sekmesi için)

### Adım 9.4 — Oluşturan da kabul eder

Deal oluşturmak **otomatik kabul değildir**. Oluşturan taraf da **Join** ile deal’i açıp **Accept terms** demelidir (PendingAccept → Open).

---

## 10. Karşı taraf: deal’e katılma

**Join deal** sekmesi:

1. Deal contract adresini yapıştır → **Load deal**
2. Durum: `PendingAccept` → her iki taraf **Accept terms**
3. Durum: `Open`:
   - **Alıcı:** Approve USDT + deposit
   - **Satıcı:** Approve token + deposit
4. İkisi de yattığında kontrat çoğu zaman **otomatik settle** eder; gerekirse **Settle**
5. Sonuç: `Settled` — USDT satıcıya, token alıcıya, ücret `feeRecipient`’a

### Zaman aşımı / iptal

| Durum | Kim | Aksiyon |
|-------|-----|---------|
| Funding süresi doldu, eksik yatırım | Her iki taraf | **Claim refund** |
| Karşılıklı iptal | Her iki taraf | **Request cancel** (kontrat kurallarına göre) |

---

## 11. Sorun giderme

| Belirti | Olası neden | Çözüm |
|---------|-------------|--------|
| Factory not deployed | `escrow.json` sıfır adres | Deploy + json + rebuild |
| Invalid token / revert | Yanlış `tokenDecimals` | Explorer’da token `decimals()` okuyun |
| USDT deposit revert | Yetersiz USDT veya approve | Bakiye + approve miktarı = deal `usdtAmount` |
| BSC USDT miktarı yanlış | BSC USDT 18 decimal | UI’da USDT’yi insan okunur girin; arka plan `usdtDecimals` kullanır |
| Karşı taraf göremiyor | Yanlış ağ seçili | Join’de aynı `chainKey` |
| Deal adresi yok | Event okunmadı | Factory tx → logs → `OtcDealCreated.deal` |

---

## Özet kontrol listesi

- [ ] `forge test` geçti
- [ ] 4 ağda (veya kullanacağınız ağlarda) Factory + Registry deploy
- [ ] Adresler explorer’da doğrulandı
- [ ] `escrow.json` güncellendi + `protocolFeeRecipient` ayarlandı
- [ ] `npm run build:prod` + Chrome’da `dist` yüklendi
- [ ] Küçük miktarlı gerçek OTC testi (create → accept → deposit → settled)

**Bitcoin / Solana:** Cüzdanda bakiye var; Escrow OTC bu sürümde **yakında** — aynı mantık için ayrı program/kontrat gerekir.

---

İngilizce teknik özet: [ESCROW.md](./ESCROW.md)
