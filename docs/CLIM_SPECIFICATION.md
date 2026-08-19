# Bảng Thông Số Kỹ Thuật Ứng Dụng CLIM (CLIM Technical Specification)

> **CLIM (CLI Manager)** — Nền tảng quản trị dòng lệnh, tự động hóa quy trình, giám sát hệ thống, máy chủ từ xa SSH và Trợ lý AI toàn năng trên máy tính để bàn (Desktop).

---

## 1. Thông Tin Tổng Quan (General Overview)

| Thông số | Chi tiết |
| :--- | :--- |
| **Tên sản phẩm** | **CLIM** (Command Line Interface Manager) |
| **Phiên bản hiện tại** | **`v1.6.0`** (Desktop Edition) |
| **Tác giả / Nhà phát triển** | LEVI TRAN |
| **Bản quyền (License)** | MIT License |
| **Kiến trúc ứng dụng** | Desktop Application (Electron Multi-Process Architecture) |
| **Hệ điều hành mục tiêu** | Windows 10/11 (x64, ARM64) · Tương thích Linux & macOS |
| **Ngôn ngữ hỗ trợ** | Song ngữ: **Tiếng Việt (`vi-VN`)** & **English (`en-US`)** |
| **Mô hình triển khai** | Standalone Desktop Executable (`.exe`, Portable & Installer) |

---

## 2. Ngăn Xếp Công Nghệ (Technology Stack)

| Lớp kiến trúc (Layer) | Công nghệ / Thư viện | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Core Desktop Runtime** | **Electron 33+ / Node.js 20+** | Quản lý tiến trình nền (Main Process), IPC Bridge, Native OS APIs |
| **Frontend Framework** | **React 18.3 (TypeScript 5)** | Giao diện người dùng hướng thành phần (Component-driven UI) |
| **Build & Bundler** | **Vite / Electron-Vite / OXC** | Hot Module Replacement (HMR), tối ưu hóa bundle siêu tốc |
| **State Management** | **Zustand 4.5** | Quản lý trạng thái phân tán, nhẹ, hiệu năng cao, zero boilerplate |
| **Terminal Core & PTY** | **`node-pty 1.1`** | Khởi tạo pseudoterminal native cấp hệ điều hành (PowerShell, CMD, WSL) |
| **Terminal Rendering** | **`@xterm/xterm 5.5`** | Bộ render WebGL/Canvas terminal chuẩn ANSI, hỗ trợ xterm-256color |
| **Terminal Addons** | `@xterm/addon-fit`, `@xterm/addon-web-links` | Tự động căn chỉnh kích thước (Autofit) và bắt liên kết URL |
| **Styling & Design System**| **Tailwind CSS 3.4 + Radix UI** | Giao diện hiện đại Cyberpunk / Glassmorphism, Dark/Light Mode |
| **Animations** | **Framer Motion 11.15** | Hiệu ứng chuyển động mượt mà, micro-animations, transitions |
| **Local Storage** | **`electron-store 8.2`** | Lưu trữ cấu hình cục bộ bảo mật, mã hóa dữ liệu nhạy cảm |
| **Testing Suite** | **Vitest 4.1 + React Testing Library** | Kiểm thử tự động đơn vị (Unit Test) và tích hợp (Integration Test) |

---

## 3. Bảng Chi Tiết Tính Năng & Thông Số Module (Module Specifications)

### 3.1. Quản Trị Cửa Sổ Dòng Lệnh (Terminal Workspace & Grid)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Shell Hỗ Trợ** | Windows PowerShell 5.1, PowerShell 7 (Core), Command Prompt (CMD), WSL Linux (Ubuntu/Debian), Git Bash, Custom Shells |
| **Chế độ hiển thị (Layout)** | Cửa sổ đơn (Single), Chia đôi dọc (Split Vertical 1x2), Chia đôi ngang (Split Horizontal 2x1) |
| **Tiến trình ngầm (Background)**| Hỗ trợ ẩn các tiến trình dài hạn (server, build watch) sang Background và khôi phục 1-click |
| **Giám sát Sống còn (Watchdog)**| Tự động cảnh báo qua **Telegram/Discord Webhook** khi tiến trình crash hoặc dừng đột ngột; tùy chọn tự khởi động lại |
| **Ghi hình phiên (Recorder)** | Ghi nhận I/O thời gian thực; xuất ra 3 định dạng: **`.html`** (Player độc lập), **`.cast`** (Asciinema v2), **`.txt`** (Log có timestamp) |

### 3.2. Quản Lý Kho Lệnh & Biến Tham Số (Command & Parameter Engine)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Cú pháp biến tham số** | Hỗ trợ `{{VAR_NAME}}` hoặc `{{VAR_NAME:-default_value}}` |
| **Form điền động (Interactive UI)**| Tự động phân tích cú pháp lệnh để tạo bảng điền tham số trực quan trước khi thực thi |
| **Phân loại & Tìm kiếm** | Lọc theo Danh mục (Category), Thẻ (Tags), Lệnh Yêu Thích (Favorites), Tìm kiếm full-text |
| **Phím tắt nhanh** | Kích hoạt và tìm kiếm lệnh toàn cục bằng tổ hợp phím `Ctrl + K` (Command Palette) |

### 3.3. Dãy Lệnh & Tự Động Hóa Quy Trình (Command Sequences & Pipelines)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Chế độ thực thi (Run Modes)**| `Manual` (Từng bước), `Run First` (Dừng nếu bước đầu lỗi), `Run All` (Tuần tự liên tục) |
| **Xử lý luồng (Execution Control)**| Bảng theo dõi tiến độ thời gian thực (Sequence Runner Panel), nút Dừng khẩn cấp (Emergency Stop) |
| **Đếm bước & Tùy biến** | Không giới hạn số lượng bước (Steps), tự do sắp xếp thứ tự và cấu hình shell riêng cho từng bước |

### 3.4. Lập Lịch Tác Vụ Tự Động (Cron & Task Scheduler)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Loại lịch trình (Schedule Types)**| Khoảng thời gian định kỳ (`Interval` theo giây/phút), Lặp lại hàng ngày (`Daily` theo giờ cố định), Khởi động ứng dụng (`Startup`) |
| **Đếm ngược thời gian thực** | Live Countdown Badge hiển thị thời gian còn lại đến lần chạy kế tiếp |
| **Nhật ký thực thi (Execution Logs)**| Lưu trữ lịch sử chạy, Exit Code, thời lượng thực thi (`durationMs`), xem và sao chép log 1-click |
| **Kênh thông báo** | Thông báo hệ thống Desktop Notification, gửi Webhook tự động đến Discord/Telegram |

### 3.5. Hồ Sơ Môi Trường Độc Lập (Environment Profiles)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Cơ chế nạp biến** | Inject trực tiếp biến môi trường (`ENV_VAR=VALUE`) vào tiến trình con PTY khi mở terminal |
| **Quản lý đa cấu hình** | Cho phép tạo nhiều profile (ví dụ: Dev, Staging, Production, Node v18, Node v20) |
| **Chuyển đổi tức thì** | Chuyển đổi Profile hoạt động (Active Profile) ngay trên thanh StatusBar mà không cần khởi động lại máy |

### 3.6. Bảng Điều Khiển Docker (Docker Containers GUI)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Giám sát Daemon** | Tự động phát hiện trạng thái Docker Desktop (Online/Offline) kèm nút kết nối lại |
| **Thao tác 1-Click** | `Start`, `Stop`, `Restart`, `Delete Container` |
| **Kiểm tra chuyên sâu** | Xem Log thời gian thực (Realtime Tail Logs), Tra cứu Cổng Mở (Port Mapping), Mở Shell trực tiếp vào container |

### 3.7. Máy Chủ Từ Xa SSH & Tunneling (Remote SSH Manager)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Xác thực an toàn** | Hỗ trợ SSH Private Key (PEM, OpenSSH) và Mật khẩu (mã hóa an toàn) |
| **Kiểm tra độ trễ (Latency)** | Tự động đo Ping mạng và trạng thái Online/Offline của máy chủ |
| **Port Forwarding (Tunneling)**| Cấu hình SSH Tunnel trực quan: Local Forwarding (`-L`), Remote Forwarding (`-R`), Dynamic SOCKS5 Proxy |

### 3.8. Giám Sát Tài Nguyên & Mạng (Resource & Network Monitor)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Tài nguyên phần cứng** | Theo dõi trực quan phần trăm CPU, RAM đã dùng / Tổng dung lượng RAM, System Uptime |
| **Quản lý tiến trình (Inspector)**| Bảng tra cứu PID, mức chiếm dụng bộ nhớ, cổng mạng đang lắng nghe (Listening Ports) kèm nút đóng tiến trình (`Kill PID`) |

### 3.9. Trợ Lý Trí Tuệ Nhân Tạo & Báo Cáo Sự Cố (AI Copilot & Incident Center)
| Tính năng | Thông số kỹ thuật & Khả năng hỗ trợ |
| :--- | :--- |
| **Trợ lý AI Copilot** | Sinh câu lệnh tự động từ ngôn ngữ tự nhiên, giải thích cú pháp phức tạp |
| **Chẩn đoán lỗi Terminal** | Tự động trích xuất mã lỗi từ buffer terminal và đề xuất lệnh khắc phục 1-click |
| **Incident Report & Webhook** | Tạo báo cáo sự cố chuẩn Markdown kèm log và gửi Webhook tức thì |

---

## 4. Bảng Yêu Cầu Hệ Thống (System Requirements)

| Tiêu chí | Cấu hình tối thiểu | Cấu hình khuyến nghị |
| :--- | :--- | :--- |
| **Hệ điều hành** | Windows 10 (Build 19041+) 64-bit | Windows 11 (64-bit) |
| **Bộ xử lý (CPU)** | Intel Core i3 / AMD Ryzen 3 (2 nhân, 2.0 GHz) | Intel Core i5 / AMD Ryzen 5 hoặc cao hơn |
| **Bộ nhớ RAM** | 4 GB RAM | 8 GB RAM trở lên |
| **Dung lượng ổ đĩa** | 300 MB dung lượng trống | 1 GB dung lượng SSD trống |
| **Môi trường bổ trợ** | Windows PowerShell 5.1 | PowerShell 7, WSL2, Docker Desktop, Git for Windows |

---

## 5. Bảng Chỉ Số Hiệu Năng & Độ Ổn Định (Quality & Performance Metrics)

| Chỉ số đo lường (Metric) | Kết quả đạt được | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Thời gian khởi động lạnh (Cold Start)** | `< 1.2 giây` | Tối ưu hóa nhờ kiến trúc Vite & Code-splitting |
| **Mức chiếm dụng RAM cơ bản** | `~85 MB – 130 MB` | Quản lý bộ nhớ PTY tối ưu, tự động giải phóng session đóng |
| **Độ trễ phản hồi gõ Terminal** | `< 8 ms` | Render tăng tốc phần cứng qua xterm.js Canvas |
| **Độ bao phủ kiểm thử (Test Coverage)**| **100% Pass** (55/55 Tests) | 14 bộ test tự động (Vitest) kiểm soát toàn bộ Zustand stores |
| **Chuẩn an toàn TypeScript** | **0 Type Errors** | Kiểm tra nghiêm ngặt `tsconfig.node.json` & `tsconfig.web.json` |
| **Bảo mật cục bộ** | Client-Side Only | Không gửi dữ liệu lệnh hay SSH Key ra máy chủ trung gian |
