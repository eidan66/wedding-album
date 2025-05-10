# 💍 Wedding Album — React + TypeScript + Vite

A mobile-first web app built with React, Vite, and Styled Components that allows wedding guests to upload their photos and videos directly to a live album via QR code scanning.

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** for super fast bundling
- **Styled Components** for scoped styling and themes
- **Custom Modal System** for media confirmation
- **File Upload** supporting images and videos (MP4, WebM, MOV)
- **RTL Support** with full Hebrew layout
- **Mobile-first responsive design**

---

## 📁 Folder Structure

```
.
├── public/                # Static assets
├── src/
│   ├── assets/           # Images, SVGs
│   ├── components/       # Hero, Modal, PhotoGrid etc.
│   ├── styles/           # Global styles + theme
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── index.html
├── vite.config.ts
└── tsconfig.app.json
```

---

## 🚀 Getting Started

```bash
# Install dependencies
yarn install

# Run locally
yarn dev

# Build for production
yarn build
```

---

## 🌈 Theming

We support a single theme called `sageTheme` (inspired by cream & sage tones).

---

## 🖼️ Upload Flow

1. User clicks on “שתפו תמונות”
2. Can choose multiple files (images or videos)
3. Modal shows previews with "X" to remove individual items
4. After confirmation, a heart-loader animates while uploading
5. Items are added to the photo grid below

---

## ✅ To Do

- [ ] Backend integration for file uploads
- [ ] Real-time photo gallery updates
- [ ] Admin moderation panel
- [ ] Download full album feature

---

## ❤️ Created by [Idan Levian](https://idanlevian.com)
