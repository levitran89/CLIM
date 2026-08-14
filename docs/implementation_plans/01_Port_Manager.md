# Lịch Sử Nâng Cấp Ứng Dụng (CLIM)

Tài liệu này lưu trữ lịch sử các tính năng đã được bổ sung, quá trình triển khai và các thay đổi lớn trong ứng dụng CLIM để tiện theo dõi và bảo trì.

---

## [Ngày 20/07/2026] - Tính Năng Quản Lý Port (Port Manager)

### 1. Mục tiêu
Tích hợp một công cụ quản lý các Port đang mở trên máy tính ngay bên trong CLIM, giúp người dùng dễ dàng xem tiến trình nào đang chiếm dụng port và có thể dừng (kill) chúng một cách an toàn mà không cần mở CMD thủ công.

### 2. Kế hoạch Triển khai (Implementation Plan)
- **Backend (Main Process & IPC):** 
  - Tạo `port-manager.ts` sử dụng lệnh `netstat -ano` và `tasklist` của Windows để quét danh sách các cổng đang lắng nghe (LISTENING) và liên kết chúng với mã tiến trình (PID) và tên tiến trình.
  - Mở các kênh giao tiếp IPC: `system:getPorts` và `system:killPort`.
- **Frontend (Renderer Process):**
  - Cấu trúc lại `Sidebar.tsx` để có thể chuyển đổi giữa 2 tab: "Lệnh" (CommandList) và "Ports" (PortList).
  - Xây dựng component `PortList.tsx` với khả năng: Lọc/tìm kiếm port, làm mới danh sách thủ công, và xem chi tiết từng port.
- **Dữ liệu & An toàn:**
  - Tích hợp `port-dict.ts` (Từ điển Port) chứa mô tả chức năng của các port phổ biến.
  - Đánh dấu các port hệ thống (System) như 135, 445... và vô hiệu hóa nút Kill để ngăn chặn người dùng vô tình làm hỏng Windows.
- **Cải thiện UX:**
  - Cung cấp gợi ý cú pháp `--port` ở khung Sửa/Tạo lệnh (`CommandForm.tsx`) để người dùng mới dễ dàng hiểu cách đổi port.

### 3. Chi tiết các thay đổi
- Thêm `src/main/port-manager.ts`
- Cập nhật `src/main/ipc-handlers.ts` và `src/preload/index.ts`
- Cập nhật kiểu dữ liệu ở `src/shared/types.ts`
- Thêm `src/renderer/components/ports/PortList.tsx`
- Thêm `src/renderer/components/ports/port-dict.ts`
- Cập nhật `src/renderer/components/layout/Sidebar.tsx` để thêm thanh chuyển đổi Tab.
- Cập nhật `src/renderer/components/commands/CommandForm.tsx` (Thêm phần "Gợi ý cú pháp đổi port").
- (Cập nhật sau cùng): Gỡ bỏ hộp thoại đổi port phức tạp bên tab Ports, hướng người dùng sang tab Lệnh để sửa trực tiếp, tạo trải nghiệm nhất quán hơn.
