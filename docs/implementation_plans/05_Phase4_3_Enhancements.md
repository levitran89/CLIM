# Implementation Plan: Phase 4.3 Comprehensive Enhancements

## User Requirements
1. **SFTP File Explorer HD Size & Close Button:**
   - Expand `SFTPFileExplorerModal` to HD resolution (`max-w-6xl w-[94vw] h-[88vh]`).
   - Add a prominent `X` close button in the header.
   - Fix OpenSSH `Bad permissions / UNPROTECTED PRIVATE KEY FILE` on Windows by auto-setting ACL (`icacls`) on private key files.
   - Provide an option to securely store uploaded private keys in `userData/ssh_keys/`.
2. **Persistent View Modes:**
   - Remember selected view modes (Grid / Compact, 1 column / 2 columns) in `useSettingsStore` across tab switches and app restarts.
3. **Tab Order Adjustment:**
   - Place `Chẩn Đoán Mạng (Network)` before `Quản Lý Cổng Mạng (Ports)` in navigation.
4. **DNS TXT Export:**
   - Add "Xuất File TXT" button to DNS lookup results in `NetworkDiagnosticsView.tsx`.
5. **Docker Manager Visibility & Testing:**
   - Add Docker containers card to Dashboard.
   - Provide clear connection state, test demo toggle, and container management guide.
6. **Scheduler Live Countdown, Execution Status & View Log Button:**
   - Add dynamic countdown timer (`Chạy sau: 04:32`) on every scheduled task card.
   - Add "Xem Log Cuối" button directly on each task card.
   - Fix Discord / Telegram webhook execution bug (commands not found during automatic cron runs, exit code evaluation, UTF-8 output).
7. **UI Compact / 1-Col / 2-Col View Modes:**
   - Ports Manager (`PortManager.tsx`): Add Grid / Compact and 1-col / 2-col toggles.
   - System Resource Monitor (`ResourceMonitor.tsx`): Keep CPU/RAM/Uptime full-width, add Grid / Compact view mode for process list.
   - Dashboard (`DashboardOverview.tsx`): Add Docker and Network Diagnostics cards, plus a Compact / Detailed view toggle.
