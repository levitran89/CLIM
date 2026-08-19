# Lộ Trình Phát Triển Ứng Dụng CLIM (Product Roadmap & TODO)

Tài liệu này lưu trữ danh sách các tính năng và cải tiến đã lên kế hoạch cho các giai đoạn tiếp theo của ứng dụng **CLIM**.

---

## 📌 GIAI ĐOẠN 3: Quản Lý Máy Chủ Từ Xa (Remote SSH Manager) & Ghi Lại Lịch Sử Terminal (Session Recording) - [HOÀN THÀNH ✅]

### 1. Trình Quản Lý Kết Nối Máy Chủ SSH (Remote SSH Manager)
- [x] Lưu danh sách Server VPS/Cloud với IP, Port, Username, Private Key (PEM/PPK) hoặc Password (mã hóa an toàn).
- [x] Khởi chạy terminal kết nối SSH trực tiếp 1-click.
- [x] Hỗ trợ Tunneling và Port Forwarding tự động (`-L` và `-R`).
- [x] Ping kiểm tra độ trễ mạng (latency ms) và trạng thái Online/Offline theo thời gian thực.
- [x] Hỗ trợ chuyển đổi giao diện Thẻ Lưới (2-Column Cards) và Bảng Danh Sách (Table View).

### 2. Ghi Lại Phiên Terminal & Đánh Dấu Log (Terminal Session Recording & Bookmarks)
- [x] Ghi lại toàn bộ phiên làm việc terminal theo thời gian thực.
- [x] Xuất bản ghi đa định dạng: Asciinema Cast (`.cast v2`), Trình phát HTML Độc Lập (`.html Standalone Player`), và Plain Text Log (`.txt`).
- [x] Xuất Báo Cáo Sự Cố (Incident Report Modal) kèm phân tích AI, sao chép Markdown và 1-click gửi Webhook Discord / Telegram.

### 3. Tùy Chỉnh Phím Tắt Toàn Cục (Custom Keybindings)
- [x] Cho phép người dùng tùy chỉnh toàn bộ phím tắt `Ctrl+Space`, `Ctrl+K`, `Ctrl+1..7`, `Ctrl+T`, `Ctrl+W`, `Ctrl+,`, `F1` theo thói quen cá nhân.
- [x] Giao diện bắt phím trực tiếp (Key Combination Recorder) kèm kiểm tra và cảnh báo trùng phím.

---

## 📌 GIAI ĐOẠN 4: Đa Ngôn Ngữ, Thiết Kế Logo & Mở Rộng Hệ Sinh Thái (v1.6.0) - [HOÀN THÀNH ✅]

### 1. Thiết Kế Logo & Bộ Nhận Diện Thương Hiệu (Branding & Logo)
- [x] Thiết kế Vector Logo SVG phong cách Cyberpunk / Modern Minimalist (`>_` Terminal + Lightning Glow).
- [x] Xuất bản định dạng icon `build/icon.ico` cho Windows installer và `build/icon.png`.
- [x] Tích hợp logo lên thanh `TitleBar` và xây dựng hộp thoại `About CLIM Modal`.

### 2. Hệ Thống Đa Ngôn Ngữ Song Ngữ (Localization - English & Tiếng Việt)
- [x] Tạo module i18n (`src/renderer/locales/vi.ts`, `src/renderer/locales/en.ts`).
- [x] Tích hợp nút chuyển đổi nhanh ngôn ngữ `🇻🇳 VI` / `🇬🇧 EN` trên TitleBar & Settings.
- [x] Dịch thuật toàn bộ giao diện, modal hướng dẫn và thông báo hệ thống.

### 3. Mở Rộng Hệ Sinh Thái Công Cụ & Quản Trị
- [x] **SFTP Remote File Explorer**: Trình quản lý cây thư mục tệp đồ họa bên cạnh terminal SSH (Upload kéo thả / Download / Xem & Sửa tệp trên VPS).
- [x] **Docker Containers GUI Manager**: Bảng điều khiển quản lý container Docker 1-click (Start, Stop, Restart, View Logs realtime & 1-Click Shell).
- [x] **Network Diagnostics Suite**: Biểu đồ Ping thời gian thực, HTTP Endpoint & SSL Certificate Checker, DNS Multi-Record Lookup.
- [x] **Session Restore & Auto-Save**: Tự động lưu và đồng bộ cấu hình, cài đặt qua `electron-store`.

---

*Tài liệu này được duy trì và cập nhật liên tục theo tiến độ phát triển của CLIM.*
