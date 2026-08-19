# Kế Hoạch Triển Khai Giai Đoạn 2: Trợ Lý AI CLI Copilot & Điền Biến Động (Interactive Placeholders)

## 1. Mục Tiêu (Goal)
Triển khai hệ thống Trợ lý Trí tuệ Nhân tạo (AI Copilot) đa nhà cung cấp (Gemini, OpenAI, Claude, Ollama Local) và tính năng Điền Biến Động Tương Tác (Interactive Parametric Commands) giúp người dùng sinh câu lệnh từ ngôn ngữ tự nhiên, tự động sửa lỗi terminal và tùy biến tham số lệnh linh hoạt.

---

## 2. Các Thành Phần Triển Khai (Components)

### A. Quản Lý Cấu Hình & Store AI (`ai-store.ts`)
- Hỗ trợ đa nhà cung cấp:
  - `gemini`: Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`)
  - `openai`: OpenAI API (`gpt-4o`, `gpt-4o-mini`)
  - `claude`: Anthropic Claude API (`claude-3-5-sonnet-20241022`)
  - `ollama`: Ollama Cục bộ (`http://localhost:11434` - `qwen2.5-coder`, `deepseek-coder`, `llama3`)
  - `custom`: Tương thích OpenAI endpoint (DeepSeek, Groq, OpenRouter)
- Quản lý lịch sử hội thoại AI và lưu trữ cục bộ bảo mật qua `localStorage` (mã hóa nếu có master password).

### B. Dịch Vụ Gọi AI Backend/IPC & Trực Tiếp (`ai-service.ts`)
- Phương thức `generateCliCommand(prompt, shell, activeProfile)`:
  - Sinh câu lệnh CLI chuẩn xác, an toàn, kèm giải thích cờ lệnh.
- Phương thức `explainAndFixError(errorMessage, lastCommand, shell)`:
  - Phân tích log lỗi terminal khi exit code != 0, giải thích nguyên nhân và đề xuất lệnh khắc phục 1-click.

### C. Giao Diện AI Copilot (`AICopilotModal.tsx` & Tab / Nút AI)
- Mở nhanh qua phím tắt `Ctrl + Space` hoặc biểu tượng Robot AI trên thanh Header/Menu.
- Khung nhập liệu ngôn ngữ tự nhiên (Tiếng Việt/Anh).
- Thẻ kết quả hiển thị:
  - Câu lệnh được định dạng syntax highlight.
  - Giải thích các tham số/cờ lệnh.
  - 3 nút hành động: **"🚀 Chạy Trong Terminal"**, **"📋 Sao Chép"**, **"💾 Lưu Vào Danh Mục"**.

### D. Điền Biến Động Tương Tác (Interactive Parametric Command Dialog)
- Tự động phát hiện các biến dạng `{{PARAM_NAME}}` hoặc `{{PARAM_NAME:-default}}` trong câu lệnh chưa có trong Hồ Sơ Môi Trường.
- Bật popup điền giá trị trực quan với Live Preview câu lệnh thời gian thực trước khi gửi sang Terminal.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)
- Unit tests cho `ai-store.ts` và parser trích xuất placeholder biến động `{{...}}`.
- Kiểm tra toàn bộ luồng sinh lệnh và chạy lệnh trong Terminal.
- Typecheck & test suite 100% passed.
