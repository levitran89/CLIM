# Nhật Ký Thay Đổi (Changelog) - CLIM

Toàn bộ các cập nhật, tính năng mới, cải tiến giao diện và sửa lỗi của ứng dụng **CLIM (Command Line Interface Manager)** được ghi nhận chi tiết theo từng phiên bản tại đây.

---

## [1.4.0] - 2026-08-18 (Giai Đoạn 2: Trợ Lý AI CLI Copilot, Tự Động Sửa Lỗi & Điền Biến Động)

### ✨ Tính Năng Mới
- **Trợ Lý AI CLI Copilot Đa Nhà Cung Cấp (`Ctrl + Space`)**:
  - Dịch yêu cầu từ ngôn ngữ tự nhiên (tiếng Việt/tiếng Anh) thành câu lệnh CLI chuẩn xác cho PowerShell, CMD hoặc WSL Linux.
  - Hỗ trợ đầy đủ các nhà cung cấp AI hàng đầu:
    - ⚡ **Google Gemini**: Gemini 1.5 Flash (mặc định siêu tốc), Gemini 1.5 Pro.
    - 🧠 **OpenAI**: GPT-4o, GPT-4o-mini.
    - 🔮 **Anthropic Claude**: Claude 3.5 Sonnet.
    - 💻 **Ollama Local**: Chạy offline 100% riêng tư và bảo mật trên máy (`qwen2.5-coder`, `deepseek-coder-v2`, `llama3.2`).
    - 🌐 **Custom OpenAI-compatible**: Tương thích DeepSeek API, Groq, OpenRouter.
  - Giải thích chi tiết ý nghĩa từng cờ lệnh (flags/arguments).
  - Tự động phát hiện và cảnh báo các câu lệnh có khả năng gây nguy hiểm cho hệ thống (`isDangerous`).
  - Nút hành động 1-Click: "Chạy Trong Terminal", "Lưu Vào Danh Mục Lệnh", "Sao Chép".
  - Lưu trữ lịch sử các câu lệnh đã sinh với khả năng tìm lại và chạy lại nhanh.
- **Tự Động Chẩn Đoán & Sửa Lỗi Terminal (AI Error Explainer & Auto-Fixer)**:
  - Phân tích mã lỗi và log terminal khi lệnh thất bại (`exit code != 0`).
  - Chẩn đoán nguyên nhân gốc rễ và đề xuất ngay lập tức câu lệnh khắc phục với nút "Chạy Lệnh Khắc Phục Ngay".
- **Điền Biến Động Tương Tác (Interactive Parametric Commands)**:
  - Hỗ trợ cú pháp placeholder `{{PARAM_NAME}}` và `{{PARAM_NAME:-default}}`.
  - Tự động bật hộp thoại điền tham số với Live Preview câu lệnh thời gian thực trước khi gửi sang Terminal.
- **Thông Tin Công Cụ Yêu Cầu Tại Kho Lệnh Mẫu (Tool Stack Requirements)**:
  - Bổ sung huy hiệu công cụ yêu cầu (Docker Desktop, Node.js 18+, Python 3.10+, PowerShell 5.1+, Git) trên từng thẻ gói lệnh và trong hộp thoại chi tiết.
- **Sửa Lỗi & Tối Ưu Giám Sát Tài Nguyên Hệ Thống (Resource Monitor)**:
  - Nâng cấp câu lệnh PowerShell truy vấn danh sách tiến trình nhanh, khắc phục triệt để lỗi phân tích cú pháp ký tự đặc biệt, đảm bảo bảng tiến trình lập trình (powershell, cmd, node, electron, python, git...) luôn hiển thị trực quan và cập nhật liên tục.

---

## [1.3.0] - 2026-08-18 (Giai Đoạn 4: Đồng Bộ Đám Mây GitHub Gist & Kho Lệnh Mẫu Snippet Hub)

### ✨ Tính Năng Mới
- **Đồng Bộ Đám Mây Cá Nhân (GitHub Gist 2-Way Sync)**:
  - Tích hợp kết nối trực tiếp với GitHub Gist API thông qua GitHub Personal Access Token (PAT).
  - Hỗ trợ lưu trữ Secret Gist riêng tư, đồng bộ 2 chiều (Tải lên / Push Backup & Tải về / Pull Backup).
  - Tự động ghi nhớ `gistId` và thời gian đồng bộ lần cuối (`lastSyncedAt`).
- **Mã Hóa Đầu Cuối Tuyệt Đối (End-to-End Encryption - AES-256-GCM + PBKDF2)**:
  - Cho phép người dùng thiết lập Master Password cá nhân khi sao lưu lên đám mây.
  - Tự động mã hóa toàn bộ dữ liệu cấu hình nhạy cảm (API Keys, Passwords, Môi trường) bằng thuật toán quân sự `AES-256-GCM` với key derivation 100,000 vòng qua `PBKDF2`.
  - Khóa dữ liệu an toàn ngay cả khi chia sẻ Gist.
- **Kho Lệnh Mẫu Thực Chiến 1-Click (Built-in Snippet Hub)**:
  - Cung cấp hơn 30+ câu lệnh và quy trình mẫu thực chiến cho lập trình viên:
    - 🐳 **Docker & Kubernetes**: Dọn rác prune, liệt kê container, compose stack.
    - ⚛️ **Node.js, React & Web**: Khởi tạo Vite TS, clean reinstall dependencies, build preview.
    - 🐍 **Python, Data Science & AI**: Tạo virtualenv, kiểm tra GPU CUDA PyTorch, requirements.
    - 🪟 **Windows DevOps & Mạng**: Flush DNS, đo ping latency, dọn dẹp temp, xem service.
    - 🚀 **Git Pro Workflows**: Hủy commit an toàn, stash có ghi chú, prune remote branches.
    - 🔄 **Full-Stack & DevOps Pipelines**: Setup môi trường full-stack và stack database container.
  - Hỗ trợ **"Cài đặt toàn bộ gói"** hoặc **"Thêm riêng từng câu lệnh"** mà không ghi đè dữ liệu cũ.
- **Giao Diện & Tìm Kiếm Nâng Cao**:
  - Modal **Kho Lệnh Mẫu (Snippet Hub)** với bộ lọc danh mục và xem trước câu lệnh.
  - Mục **Đồng bộ Đám mây** trong cửa sổ Cài đặt kèm chức năng Kiểm tra Token tức thì.
  - Tích hợp mở nhanh Kho Lệnh Mẫu từ Spotlight (`Ctrl + K`).

---

## [1.2.0] - 2026-08-18 (Giai Đoạn 3: Lập Lịch Tự Động, Giám Sát Tài Nguyên & Webhooks)

### ✨ Tính Năng Mới
- **Động cơ Lập lịch Tác vụ Tự động (Cron & Task Scheduler)**:
  - Hỗ trợ 3 chế độ lập lịch: Theo chu kỳ phút (`interval`), Theo giờ cố định hàng ngày (`daily` - `HH:mm`), và Khi mở ứng dụng (`startup`).
  - Hỗ trợ chọn chạy bất kỳ Câu lệnh đơn hoặc Quy trình chuỗi lệnh trong nền.
  - Tự động lưu trữ lịch sử thực thi (`TaskExecutionLog`) gồm thời lượng chạy (`durationMs`), trạng thái thành công/thất bại, mã thoát (`exitCode`) và xem log trích xuất chi tiết.
- **Giám sát Tài nguyên Hệ thống Thời gian thực (Live Resource Monitor)**:
  - Đồng hồ đo CPU (%) và RAM (GB đã dùng / Tổng dung lượng) cập nhật trực tiếp mỗi 2.5 giây.
  - Bảng theo dõi tiến trình chi tiết (PID Tracking) tự động quét các PID của Terminal sessions và Ports mạng đang mở.
  - Tính năng **Kill Process** cho phép giải phóng tức thì bộ nhớ RAM hoặc CPU của tiến trình bị treo.
- **Hệ thống Thông báo Đa kênh & Webhook**:
  - Bắn thông báo Windows Desktop qua Electron Native `Notification` khi tác vụ hoàn thành trong nền.
  - Tích hợp gửi thẻ Embed báo cáo kết quả sang **Discord Webhook** hoặc tin nhắn Markdown sang **Telegram Bot**.
  - Cung cấp nút gửi thử nghiệm (Test Webhook) trực tiếp trong Cài đặt.
- **Mở rộng Điều hướng & Spotlight Search**:
  - Thêm 2 tab mới trên thanh menu: ⏰ **Lập lịch** (`Ctrl + 4`) và 📊 **Tài nguyên** (`Ctrl + 7`).
  - Tích hợp tìm kiếm tác vụ lập lịch và kích hoạt chạy ngay ("Run Now") từ hộp thoại **Spotlight (Ctrl + K)**.
  - Cập nhật hệ thống phím tắt toàn năng `Ctrl + 1..7` trong cửa sổ Hướng dẫn (`F1`).

---

## [1.1.0] - 2026-08-18 (Milestones 1 - 5: Biến Môi Trường, Quy Trình & Spotlight)

### ✨ Tính Năng Mới
- **Quản lý Cấu hình Môi trường Đa Dự án (Environment Profiles)**:
  - Cho phép tạo các bộ hồ sơ môi trường độc lập (Development, Staging, Production...).
  - Quản lý các cặp `KEY=VALUE`, hỗ trợ nhập từ file `.env` và xuất ra file `.env`.
  - Hỗ trợ cú pháp thay thế biến động `{{VAR_NAME}}` tự động giải phóng giá trị trước khi gửi tới Terminal.
  - Hệ thống biến hệ thống tích hợp sẵn: `{{PORT}}`, `{{TIMESTAMP}}`, `{{UUID}}`, `{{DATE}}`, `{{TIME}}`, `{{USER}}`, `{{CWD}}`.
- **Tự Động Hóa Quy Trình Chuỗi Lệnh (Pipelines / Sequences)**:
  - Đổi tên "Dãy lệnh" thành "Quy trình", hỗ trợ kéo thả sắp xếp các bước thực thi.
  - 3 chế độ chạy linh hoạt: `none` (không tự chạy), `first` (chạy lệnh đầu), `all` (chạy toàn bộ các bước cùng lúc trên các terminal độc lập).
  - Tích hợp thanh theo dõi tiến trình đang chạy trực tiếp trên card và nút Dừng tất cả quy trình.
- **Hộp thoại Tìm kiếm Toàn năng (Spotlight Command Palette - `Ctrl + K`)**:
  - Tìm kiếm mờ (Fuzzy search) tức thì trên toàn bộ Lệnh, Quy trình, Hồ sơ Môi trường, Tab điều hướng và Cài đặt.
  - Điều hướng bàn phím `↑` / `↓` / `Enter` / `ESC`.
- **Quản lý Cổng Mạng Trực Quan (Port Manager)**:
  - Tự động quét và liệt kê các cổng đang lắng nghe (Listening Ports).
  - Tra cứu từ điển hơn 50+ cổng dịch vụ phổ biến (HTTP, HTTPS, PostgreSQL, MySQL, Redis, MongoDB, Docker, React, Vite, Next.js...).
  - Nút dừng tiến trình (Kill PID) giải phóng cổng bị xung đột.

### 🎨 Nâng Cấp Giao Diện & Trải Nghiệm (UI/UX)
- Thiết kế chuẩn HD 1280x720 cho các cửa sổ thêm/sửa câu lệnh và quy trình, loại bỏ cuộn thanh không cần thiết.
- Tùy biến bảng màu chủ đạo (Emerald, Indigo, Violet, Amber, Rose, Cyan) đồng bộ toàn diện trên toàn ứng dụng.
- Nâng cấp modal Xác nhận (`ConfirmDialog`) hiện đại với hiệu ứng làm mờ nền (backdrop blur) và nút đóng `X` trực quan.
- Bổ sung thanh công cụ nổi (Floating Action Bar) trên từng Terminal tab: Sao chép log, Xuất file `.txt`, Xóa trắng màn hình.

---

## [1.0.0] - 2026-08-17 (Bản Phát Hành Đầu Tiên)

### ✨ Tính Năng Cốt Lõi
- Quản lý và thực thi nhanh các câu lệnh CLI trên Windows.
- Hỗ trợ đa dạng Shell: **PowerShell**, **CMD**, và **WSL (Bash)**.
- Đa nhiệm Terminal Grid với tính năng chia màn hình (Split Terminal).
- Chế độ chạy ngầm Terminal (Background execution) và thông báo trên thanh trạng thái footer.
- Nhập/Xuất cấu hình dữ liệu dự phòng chuẩn JSON.
