# ☁️ SkyRoster — Smart Shift Roster Manager

> Plan, visualize, and export shift rosters with team collaboration, cloud sync, and calendar export.

![SkyRoster Dashboard](docs/screenshot-dashboard.png)

## ✨ Features

- 🗓️ **Visual roster editor** — drag-and-drop shift assignment per day
- 🔄 **Pattern detection** — auto-detect shift cycles and fill empty days
- 👥 **Team collaboration** — share rosters in real time via team ID
- ☁️ **Cloud sync** — sign in with Google to sync across devices
- 📅 **Calendar export** — download .ics file for Google/Outlook/Apple Calendar
- 🌗 **Dark mode** — system-aware theme toggle
- 💸 **Creator support** — optional BMC / PayPal / UPI tip integration
- 📊 **Dashboard** — earnings, shift distribution, weekly summary

## 🛠️ Tech Stack

- **React 19** + **Vite 7** (HMR, fast builds)
- **Firebase** (Auth + Firestore)
- **LocalStorage** with versioned migration
- **Vanilla CSS** + DM Sans / Sora / JetBrains Mono fonts
- Zero backend — your data stays in your browser unless you sign in

## 📦 Getting Started

```bash
git clone https://github.com/raktimmondal77/skyroster.git
cd skyroster
npm install
cp .env.example .env.local   # fill in Firebase + payment config
npm run dev
```

Open http://localhost:5173

## 🧰 Scripts

| Command           | Purpose                      |
|-------------------|------------------------------|
| `npm run dev`     | Start dev server with HMR    |
| `npm run build`   | Production build to /dist    |
| `npm run preview` | Preview production build     |
| `npm run lint`    | Run ESLint                   |

## 📁 Project Structure

```
src/
├── components/      # UI components (Sidebar, Header, views, modals)
├── utils/          # Helpers (firebase, auth, analytics, ICS, sync)
├── App.jsx         # Root component, state, routing
└── main.jsx        # Entry point
```

## 🤝 Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📜 License

MIT © Raktim Mondal
