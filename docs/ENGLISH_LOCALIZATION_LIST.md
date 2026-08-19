# Danh Sách Các Thành Phần Đã Chuyển Ngữ Sang Tiếng Anh (English Localization Checklist)

Tài liệu này tổng hợp toàn bộ các mô-đun, giao diện, nhãn, nút bấm, tooltip và nội dung dữ liệu đã được hỗ trợ đa ngôn ngữ (**Tiếng Anh** / **Tiếng Việt**) trong ứng dụng **CLIM**.

---

## 1. Thanh Điều Hướng (Sidebar) & Header
- **Tab Danh Mục Chính**:
  - `Dashboard` (Tổng quan)
  - `Commands` (Kho lệnh)
  - `Sequences` (Dãy lệnh)
  - `Scheduler` (Lập lịch)
  - `Terminal` (Cửa sổ dòng lệnh)
  - `Profiles` (Môi trường)
  - `Docker` (Quản lý Container)
  - `Remote SSH` (Máy chủ SSH)
  - `Monitor` (Giám sát)
  - `Settings` (Cài đặt)
- **Header Actions**:
  - `Snippet Hub` (Kho lệnh mẫu)
  - `AI Copilot` (Trợ lý AI)
  - `Command Palette (Ctrl + K)` (Thanh tìm kiếm nhanh)
  - Chuyển đổi giao diện Sáng / Tối (Theme Toggle)
  - Chuyển đổi ngôn ngữ Tiếng Anh / Tiếng Việt (Language Switcher)

---

## 2. Trang Tổng Quan (Dashboard Overview)
- **Thông Số Hệ Thống**:
  - CPU Usage, RAM Usage, System Uptime (`d / h / m` thay vì `ngày / giờ / phút`)
  - Trạng thái `Updating...` / `Đang cập nhật`
- **Thẻ Tóm Tắt (Quick Stats)**:
  - Lệnh yêu thích (Favorite Commands)
  - Tiến trình terminal ngầm đang chạy (Background Terminals)
  - Container Docker đang chạy (Running Containers)
  - Môi trường hoạt động hiện tại (Active Environment Profile)
- **Công Cụ Nhanh (Quick Actions)**:
  - Mở Terminal mới, Quét cổng mạng, Ghi hình phiên làm việc, Khởi động Docker stack.

---

## 3. Quản Lý Kho Lệnh (Command Manager)
- **Bộ Lọc & Tìm Kiếm**:
  - Placeholder tìm kiếm: `Search commands by name, syntax, tags...`
  - Bộ lọc nhóm (Category Filters), Lọc lệnh yêu thích (Favorites).
- **Thẻ Lệnh (Command Card)**:
  - Nút `Run` / `Chạy`, `Copy` / `Sao chép`, `Edit` / `Sửa`, `Delete` / `Xóa`.
  - Tooltips giải thích shell (PowerShell, CMD, Bash, WSL, SSH).
- **Form Tạo / Sửa Lệnh (Interactive Form Dialog)**:
  - Các trường: Command Name, Shell Interpreter, Category, Syntax / Script, Description, Variables, Tags.
  - Hộp thoại xác nhận xóa lệnh (Delete Confirmation Dialog).

---

## 4. Dãy Lệnh Tự Động (Command Sequences & Pipelines)
- **Thẻ Quy Trình (Sequence Card)**:
  - Đếm số bước: `{n} commands` / `{n} lệnh` (hỗ trợ số ít/số nhiều)
  - Huy hiệu chế độ chạy: `Manual`, `Run First`, `Run All`
  - Huy hiệu trạng thái: `Running` / `Đang chạy`
  - Tooltip nút hành động: `Run sequence`, `Stop sequence`, `Edit`, `Delete`.
- **Trình Chạy Dãy Lệnh (Sequence Runner Panel)**:
  - Tiến độ thực thi theo thời gian thực (Step Progress, Elapsed Time, Output Log).

---

## 5. Lập Lịch Tự Động (Task Scheduler & Cron)
- **Thẻ Tác Vụ (Task Card)**:
  - Placeholder tìm kiếm: `Search scheduled tasks...`
  - Màn hình trống: `No scheduled tasks yet`, `Create First Scheduled Task`
  - Switch bật/tắt: `Active (Click to pause)` / `Disabled (Click to enable)`
  - Đếm ngược trực tiếp: `Next in: ...` / `Chạy sau: ...`
  - Nút & Tooltip: `View Log`, `Run now` / `Running...`, `Edit schedule`, `Delete schedule`.
  - Tooltip thông báo: `Desktop notification enabled`, `Webhook enabled (Discord / Telegram)`.
- **Hộp Thoại Chi Tiết Log (Execution Log Modal)**:
  - Tiêu đề: `Execution Log: <Task Name>`
  - Trạng thái: `Success (Exit 0)` / `Failed (Exit n)`
  - Thời lượng: `Duration: {n}s`
  - Nút: `Copy` / `Copied`, thông báo toast `Log copied to clipboard`.

---

## 6. Không Gian Terminal & Toolbar (Terminal Workspace)
- **Màn Hình Khi Chưa Có Session**:
  - Tiêu đề: `No terminal session open`
  - Hướng dẫn: `Click below to spawn a new Terminal using default shell in Settings (<SHELL>)`
  - Nút bấm: `Open Terminal (<SHELL>)`
- **Thanh Công Cụ Terminal (Actions Toolbar)**:
  - Nút Thêm Terminal: `New Terminal options (PowerShell, CMD, WSL)`
  - Menu chọn Shell: `Select Terminal Type`
  - Nút AI Sửa Lỗi: `⚡ AI Terminal Error Diagnostics & Fix`
  - Nút Báo Cáo Sự Cố: `📊 Execution Report & Webhook Dispatch`
  - Nút Watchdog Sentinel: `🛡️ Watchdog: ACTIVE (Telegram alert on crash/exit)` / `🛡️ Enable Watchdog Sentinel`
  - Nút Chạy Ngầm: `Send current terminal to background`, `Manage {n} background terminals`
  - Menu Quản Lý Tiến Trình Ngầm: `Background Terminals ({n})`, `Restore all`, `Restore to view`, `Kill / Terminate session`
  - Nút Chia Màn Hình (Split Panes): `Single window mode`, `Split vertically`, `Split horizontally`
  - Nút Tab: `Rename tab`, `Close terminal tab`
- **Ghi Hình Terminal (Terminal Recorder Button & Export Modal)**:
  - Tooltips: `Start recording terminal session`, `Click to Stop & Export`
  - Tiêu đề Modal: `Terminal Session Recorded`
  - Thông số: `Session:`, `Duration:`, `Log events:`
  - Các tùy chọn định dạng xuất file:
    - *Standalone HTML Player (.html)*: Replay directly in Chrome/Edge.
    - *Asciinema Cast (.cast v2)*: Standard format for asciinema.org.
    - *Timestamped Log (.txt)*: Export full text output with relative timestamps.

---

## 7. Quản Lý Profile Môi Trường (Environment Profiles)
- **Thẻ Cấu Hình (Profile Card)**:
  - Huy hiệu mặc định: `★ Default` / `★ Mặc định`
  - Huy hiệu đang chọn: `● ACTIVE` / `● ĐANG DÙNG`
  - Nút kích hoạt: `Activate` / `Kích hoạt`
  - Tiêu đề nhóm biến: `ENVIRONMENT VARIABLES (n)` / `BIẾN MÔI TRƯỜNG (n)`
  - Giá trị biến rỗng: `<empty>` / `<trống>`
  - Tooltip nút: `Edit profile`, `Clone profile`, `Delete profile`.
- **Hộp Thoại Tạo / Sửa Profile**:
  - Các trường: Profile Name, Description, Set as Default, Environment Variables Key-Value Table.

---

## 8. Quản Lý Docker & Containers (Docker Manager)
- **Trạng Thái & Daemon**:
  - Cảnh báo mất kết nối: `Docker daemon is offline / unreachable. Please ensure Docker Desktop is running.`
  - Nút: `Retry Connection`.
- **Thẻ Container (Container Card)**:
  - Nhãn Cổng Mở: `OPEN PORTS`, fallback `None` / `Không có`
  - Các nút hành động & Tooltip:
    - `Start` (Chạy)
    - `Stop` (Dừng)
    - `Restart` (Khởi động lại)
    - `Logs` (Xem nhật ký container)
    - `Shell` (Mở terminal bên trong container)
    - `Delete Container` (Xóa container)
- **Hộp Thoại Xem Log Container (Docker Logs Modal)**:
  - Header: `Container Logs: <Name>`
  - Tùy chọn: `Tail lines (50/100/500)`, `Follow logs (Realtime)`.

---

## 9. Quản Lý Máy Chủ Từ Xa (Remote SSH & SSHTunnel)
- **Danh Sách Máy Chủ (SSH Host Card)**:
  - Kết nối nhanh: `Connect Terminal`, `Test Ping / Latency`
  - Trạng thái Host: `Online`, `Offline`, `Connecting...`
  - Quản lý SSH Key và mật khẩu xác thực.
- **SSH Port Forwarding / Tunneling**:
  - Local Forwarding, Remote Forwarding, Dynamic SOCKS5 Proxy.

---

## 10. Giám Sát Tài Nguyên & Tiến Trình (Resource Monitor)
- **Tab Giám Sát**:
  - `System Resources` (Tài nguyên hệ thống)
  - `Process Inspector` (Danh sách tiến trình & Port mạng)
  - `System Logs` (Nhật ký hệ thống)
- **Thời Gian Uptime**:
  - Định dạng chuẩn tiếng Anh: `${days}d ${hours}h ${minutes}m`
- **Bảng Tiến Trình (Process Table & Cards)**:
  - Cột: `Process Name`, `PID`, `CPU %`, `RAM (GB/MB)`, `Port Mở`, `Hành động (Kill PID)`.

---

## 11. Kho Lệnh Mẫu (Snippet Hub)
- **6 Gói Mẫu Tích Hợp (Builtin Packs)**:
  1. *Docker & Container Master Pack*
  2. *Node.js, React & Modern Web Hub*
  3. *Python, AI & Data Science Toolbox*
  4. *Windows DevOps, Network & System Kit*
  5. *Git & GitHub Pro Workflows*
  6. *Full-Stack & DevOps Automation Pipelines*
- **Giao Diện Hub**:
  - Song ngữ Tên gói (`nameEn`), Mô tả chi tiết (`descriptionEn`), Yêu cầu công cụ (`toolRequirementsEn`).
  - Nút xem chi tiết: `Details`
  - Xem trước: `Preview n commands & workflows` / `Hide command list`
  - Yêu cầu công nghệ: `Requires: <Tools>`
  - Ô tìm kiếm: `Search by keyword, command, tag...`
  - Nút cài đặt: `Install Pack` / `Cài đặt gói lệnh`.

---

## 12. Trợ Lý AI & Chẩn Đoán Lỗi (AI Copilot & Error Diagnostics)
- **Giao Diện AI Chat**:
  - Gợi ý câu hỏi nhanh (Prompt Suggestions)
  - Tạo lệnh từ mô tả tự nhiên (Natural Language to Shell Script)
- **Modal Sửa Lỗi Tự Động (AI Error Fix Modal)**:
  - Tiêu đề: `AI Terminal Error Diagnosis`
  - Phân tích nguyên nhân gốc (Root Cause Analysis)
  - Đề xuất câu lệnh sửa lỗi (Suggested Fix Command) kèm nút `Execute in Terminal`.

---

## 13. Báo Cáo Sự Cố & Webhook (Incident Report Modal)
- **Giao Diện Báo Cáo**:
  - Tạo báo cáo sự cố tự động từ buffer terminal gần nhất.
  - Tích hợp gửi Webhook trực tiếp tới **Discord** / **Telegram**.
  - Xem trước định dạng Markdown và sao chép vào Clipboard.

---

## 14. Cài Đặt Hệ Thống & Đồng Bộ Cloud (Settings & Cloud Sync)
- **Cấu Hình Cá Nhân**:
  - Shell mặc định: PowerShell / CMD / WSL Linux / Git Bash.
  - Cấu hình font chữ, cỡ chữ, phím tắt nhanh, giao diện.
- **Đồng Bộ Đám Mây (Cloud Backup & Sync)**:
  - Xuất / Nhập cấu hình dạng JSON hoặc Gist.

---

## 15. Hướng Dẫn Sử Dụng (Guide & Help Modal)
- **Đổi Tên Mục 6**:
  - Tên tab & Tiêu đề: **Terminal** (thay vì `Terminal & Split Panes`).
- **Nội Dung Hướng Dẫn**:
  - Đầy đủ các hướng dẫn sử dụng phím tắt, chia màn hình, chạy ngầm và cấu hình tự động hóa.
