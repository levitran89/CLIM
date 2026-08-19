# CLIM

**CLI Manager** — Manage and execute CLI commands in parallel terminals. Built with Electron, React, and TypeScript.

> CLIM is a cross-platform terminal management desktop application for developers. It allows you to organize your favorite CLI commands into a categorized library, run them instantly in embedded terminal sessions, and monitor active listening ports — all from a single, intuitive interface.

---

## Features

- 📦 **Command Library**: Save, organize, and categorize frequently used CLI commands.
- 🔍 **Smart Search & Tags**: Quickly find commands by name, command string, or tags.
- ⭐ **Favorites**: Pin your most-used commands for quick access.
- 🚀 **Parallel Terminals**: Launch commands directly in an embedded terminal (PowerShell, CMD, WSL).
- 🧩 **Interactive Forms (Global Variables)**: Automatically parse variables (`$env:VAR`, `${VAR}`, `{{VAR}}`) in commands and prompt the user to input values via a global modal before execution.
- ⚙️ **Automated Sequences**: Chain multiple commands to run sequentially or concurrently. Supports two variable prompting modes:
  - **Option A (Bulk Prompt)**: For automated runs, all variables across all steps are aggregated and prompted at once.
  - **Option B (Step-by-step Prompt)**: For manual runs (No auto-start), variables are prompted step-by-step as each command is executed.
- ✂️ **Split View**: Run multiple terminals side-by-side (horizontal/vertical).
- 🌐 **Port Manager** *(Windows)*: View active listening ports, inspect process details, and safely kill processes. Handles permission errors gracefully with clear guidance for administrator access. Cross-platform support planned for Linux/macOS.
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

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory.

To create a Windows installer:

```bash
npm run build:win
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you'd like to contribute.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

Developed by [LEVI TRAN](https://github.com/levitran89).
