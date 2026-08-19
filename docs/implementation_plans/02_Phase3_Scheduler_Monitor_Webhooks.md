# Kế Hoạch Triển Khai: Giai Đoạn 3 - Lập Lịch Tự Động, Giám Sát Tài Nguyên & Webhook

**Trạng thái:** Đang triển khai  
**Mục tiêu:** Tự động hóa tác vụ định kỳ (Cron / Scheduler), theo dõi tiêu thụ CPU/RAM thời gian thực và bắn thông báo Windows Desktop / Webhook (Telegram & Discord).

---

## 1. Các Tính Năng Cốt Lõi

### ⏰ 1. Lập Lịch Tự Động Hóa (Cron Jobs & Task Scheduler)
- **3 Chế độ kích hoạt linh hoạt:**
  - `interval`: Lặp lại mỗi N phút (1, 5, 15, 30, 60, 120, 240, 1440 phút).
  - `daily`: Chạy vào một khung giờ cố định mỗi ngày (ví dụ `02:00 AM`, `08:30 AM`, `23:00`).
  - `startup`: Tự động kích hoạt ngay khi mở ứng dụng CLIM.
- **Đối tượng áp dụng:**
  - Cho phép chọn bất kỳ **Câu lệnh đơn lẻ (Command)** hoặc toàn bộ **Quy trình đa lệnh (Pipeline Sequence)**.
- **Trạng thái & Điều khiển:**
  - Nút chuyển đổi Bật/Tắt (Switch Toggle) nhanh chóng.
  - Nút "Chạy ngay (Run Now)" để kiểm tra tác vụ tức thì mà không cần đợi đến giờ.
  - Nút Chỉnh sửa & Xóa tác vụ.
- **Lịch sử Thực thi (Execution Logs & Tracker):**
  - Ghi nhận chi tiết: Trạng thái (Thành công / Thất bại), Thời gian bắt đầu, Thời gian hoàn tất, Thời lượng chạy, Mã thoát (`exitCode`), và Xem trước log đầu ra.
  - Nút "Xóa sạch lịch sử".

---

### 📊 2. Giám Sát Tài Nguyên Thời Gian Thực (Live CPU & RAM Monitor)
- **Đo lường Toàn Hệ thống (System Metrics):**
  - CPU Usage Gauge / Progress Bar (%) cập nhật mỗi 2 giây.
  - RAM Usage Gauge / Progress Bar (Đã dùng GB / Tổng GB, %).
- **Bảng Tiến trình Chi tiết (Process Breakdown Table):**
  - Quét danh sách các tiến trình thuộc Terminal Sessions đang mở và các Cổng mạng đang chiếm dụng (Listening Ports).
  - Cột: PID, Tên tiến trình (Process Name), Loại tiến trình (Terminal / Port), CPU (%), RAM (MB / GB).
  - Nút "Buộc dừng tiến trình (Kill Process)" trực tiếp với hộp xác nhận an toàn.
- **Cảnh báo thông minh (Smart Threshold Warnings):**
  - Đổi màu cam hổ phách khi RAM > 500MB.
  - Đổi màu đỏ khi CPU > 80% hoặc RAM > 1.5GB.

---

### 🔔 3. Thông Báo Desktop & Tích Hợp Webhook (Telegram & Discord)
- **Windows Native Notification:**
  - Bắn thông báo Desktop khi tác vụ định kỳ hoàn tất trong nền.
- **Discord Webhook:**
  - Gửi Embed card màu sắc hiển thị tên tác vụ, thời gian thực thi, mã thoát và kết quả.
- **Telegram Bot:**
  - Gửi tin nhắn Markdown định dạng đẹp qua Telegram Bot Token & Chat ID.
- **Cài đặt & Thử nghiệm:**
  - Cấu hình tập trung trong Cài đặt (mục *Thông báo & Webhook*).
  - Nút "Gửi thông báo thử nghiệm (Test Ping)" để kiểm tra kết nối ngay lập tức.

---

## 2. Danh Sách Tệp Thay Đổi & Tạo Mới

1. `src/shared/types.ts`: Bổ sung data interfaces cho Scheduler, Monitor, Webhook.
2. `src/main/scheduler-manager.ts`: Engine lập lịch, timer tick, thực thi ngầm, desktop notification & webhook dispatch.
3. `src/main/resource-monitor.ts`: Backend quét CPU/RAM hệ thống và chi tiết PID bằng PowerShell.
4. `src/main/ipc-handlers.ts` & `src/preload/index.ts`: Đăng ký IPC channels cho scheduler & monitor.
5. `src/renderer/stores/scheduler-store.ts`: Store quản lý tasks, logs, webhook config.
6. `src/renderer/stores/monitor-store.ts`: Store polling metrics thời gian thực.
7. `src/renderer/components/scheduler/TaskFormDialog.tsx`: Dialog tạo / sửa tác vụ lập lịch.
8. `src/renderer/components/scheduler/ExecutionLogViewer.tsx`: Bảng lịch sử thực thi.
9. `src/renderer/components/scheduler/SchedulerManager.tsx`: Giao diện chính của tab Lập lịch.
10. `src/renderer/components/monitor/ResourceMonitor.tsx`: Giao diện chính của tab Giám sát Tài nguyên.
11. `src/renderer/components/settings/SettingsModal.tsx`: Bổ sung mục Webhook & Thông báo.
12. `src/renderer/components/layout/MainContent.tsx`: Tích hợp 2 tab mới và hotkeys `Ctrl+4` / `Ctrl+7`.
13. `src/renderer/components/palette/CommandPalette.tsx`: Tích hợp tìm kiếm tác vụ lập lịch và điều hướng monitor.
14. `src/renderer/components/help/GuideModal.tsx`: Cập nhật tài liệu hướng dẫn.
