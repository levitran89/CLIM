# CLIM

**CLI Manager** — Manage and execute CLI commands in parallel terminals. Built with Electron, React, and TypeScript.

> CLIM is a cross-platform terminal management desktop application for developers. It allows you to organize your favorite CLI commands into a categorized library, run them instantly in embedded terminal sessions, and monitor active listening ports — all from a single, intuitive interface.

---

## Features

- 📦 **Command Library**: Save, organize, and categorize frequently used CLI commands.
- 🔍 **Smart Search & Tags**: Quickly find commands by name, command string, or tags.
- ⭐ **Favorites**: Pin your most-used commands for quick access.
- 🚀 **Parallel Terminals**: Launch commands directly in an embedded terminal (PowerShell, CMD, WSL).
- ✂️ **Split View**: Run multiple terminals side-by-side (horizontal/vertical).
- 🌐 **Port Manager** *(Windows)*: View active listening ports, inspect process details, and safely kill processes.
- 💾 **Import / Export**: Export your command library to JSON or import existing scripts (.bat, .ps1, .txt).
- 🌙 **Dark Theme**: Designed for long development sessions.

---

## Screenshots

**Dashboard with Command Library**  
<img src="docs/screenshots/clim_dashboard.png" alt="CLIM Dashboard" width="600"/>

**Embedded Terminals with Split View**  
<img src="docs/screenshots/clim_terminals.png" alt="CLIM Terminals" width="600"/>

**Port Manager** *(Windows)*  
<img src="docs/screenshots/clim_ports.png" alt="CLIM Port Manager" width="600"/>

*(Screenshots will be added in upcoming commits.)*

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Framework** | Electron, Vite |
| **Language** | TypeScript |
| **UI Library** | React 18, Tailwind CSS, Radix UI |
| **Terminal Emulator** | xterm.js |
| **State Management** | Zustand |
| **Backend (Native)** | Node.js, node-pty, child_process |
| **Storage** | electron-store |

---

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Clone and Install

```bash
git clone https://github.com/levitran89/CLIM.git
cd CLIM
npm install
npm run postinstall
```

### Run in Development Mode

```bash
npm run dev
```

This will start the Electron app with hot-reloading enabled.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you'd like to contribute.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

Developed by [LEVI TRAN](https://github.com/levitran89).
