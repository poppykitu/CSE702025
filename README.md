# PeopleHub HRM - Hệ thống Quản trị Nguồn nhân lực Chuyên nghiệp

Hệ thống PeopleHub HRM là một giải pháp quản trị nhân sự (HRM) cấp doanh nghiệp, được thiết kế và xây dựng dựa trên các tiêu chuẩn chuyên nghiệp của Zoho People. Ứng dụng tập trung vào tính bảo mật, quy trình phê duyệt chặt chẽ, và kiến trúc hướng tính năng (Feature-based Architecture) để đảm bảo khả năng mở rộng tối đa.

---

## 1. Hệ thống Phân quyền (RBAC Structure)

Hệ thống được xây dựng trên 4 cấp độ ủy quyền nghiêm ngặt:

| Vai trò | Quyền hạn |
|---|---|
| **Admin** | Toàn quyền hệ thống, audit logs, cấu hình người dùng |
| **HR** | Quản lý hồ sơ, tuyển dụng ATS, phê duyệt đơn từ, payroll |
| **Manager** | Xem nhân viên trực thuộc, phê duyệt trong phạm vi phòng ban |
| **Employee** | Tự phục vụ: hồ sơ cá nhân, nghỉ phép, bảng công, bảng lương |

---

## 2. Các Phân hệ Chức năng Chính

### 2.1 Xác thực Nâng cao (Authentication — Phase 2)
- **Magic Link Sign-up**: Sau đăng ký, hệ thống gửi email xác minh tài khoản qua Resend SMTP. Nhấn link trong email để truy cập ngay vào Dashboard.
- **Quên mật khẩu (Forgot Password)**: Nhập email → nhận Magic Link → đặt mật khẩu mới (không cần mật khẩu cũ, bắt buộc xác nhận lại mật khẩu).
- **Đặt lại mật khẩu (Reset Password)**: Form `PASSWORD_RECOVERY` xác thực session từ Magic Link, tự động đăng nhập và chuyển hướng vào Dashboard sau khi cập nhật.
- **Ghi nhớ đăng nhập (Remember Me)**: Toggle lưu phiên làm việc lâu dài.
- **Confirm Password**: Form đăng ký yêu cầu xác nhận mật khẩu (tối thiểu 8 ký tự).

### 2.2 Hệ thống Tuyển dụng ATS (Applicant Tracking System — Phase 2)
- **Form Ứng tuyển Công khai** (`/apply`): Trang không cần đăng nhập dành cho ứng viên, hỗ trợ upload CV (Supabase Storage), thông tin cá nhân, học vấn, kinh nghiệm, lịch sử công tác và mức lương kỳ vọng.
- **Pipeline Tuyển dụng**: 6 giai đoạn với Stepper trực quan: `Tìm nguồn → Đã nộp → Xem xét → Phỏng vấn → Tuyển dụng → Từ chối`.
- **Sao chép Link Ứng tuyển**: HR/Admin sao chép link `/apply` để chia sẻ qua các kênh.
- **Gửi Lời mời qua Email**: HR nhập email ứng viên, hệ thống gửi email HTML đầy đủ thương hiệu PeopleHub qua **Supabase Edge Function + Resend API** (không dùng Supabase Auth template).
- **Đặt lịch Phỏng vấn**: Chọn ngày giờ và người phỏng vấn, hệ thống ghi nhận vào `job_applications`.
- **Tuyển dụng tự động**: Khi nhấn "Tuyển dụng", RPC `convert_applicant_to_employee` tự tạo hồ sơ nhân viên mới và gửi Magic Link Onboarding.

### 2.3 Hồ sơ Nhân viên Nâng cao (Phase 2)
- **Tab Học vấn**: Lưu trữ và hiển thị lịch sử học vấn dạng Timeline (JSONB: `academic_background`).
- **Tab Kinh nghiệm**: Lịch sử công tác với timeline theo mốc thời gian (JSONB: `work_experience`).
- **Tab Lịch làm việc**: Hiển thị ca làm việc theo giờ và ngày làm việc trong tuần dạng grid (JSONB: `work_schedule`).

### 2.4 Trung tâm Phê duyệt (Approval Center — Phase 2)
- Trang tập trung tất cả yêu cầu đang chờ phê duyệt (HR/Admin).
- **Phê duyệt/Từ chối Đơn nghỉ phép**: Xem xét và xử lý ngay trong bảng, nhập lý do từ chối.
- **Summary Cards**: Số lượng pending theo từng loại (Nghỉ phép, Cập nhật hồ sơ, Ứng tuyển mới).
- Kiến trúc Tabs mở rộng — sẵn sàng tích hợp phê duyệt Profile Update.

### 2.5 Hệ thống Thông báo (Notifications — Phase 2)
- **Bảng `system_notifications`**: Lưu trữ tất cả thông báo hệ thống, liên kết tới bản ghi gốc.
- **Database Triggers**: Tự động tạo notification khi có đơn nghỉ phép mới hoặc hồ sơ ứng tuyển mới.
- **TopBar Popover**: Hiển thị thông báo chưa đọc (badge đỏ), phân biệt màu icon theo loại (nghỉ phép/ứng tuyển/tuyển dụng), nút "Đánh dấu đã đọc".

### 2.6 Quản lý Hồ sơ & Vòng đời Nhân sự
- **Employee Directory**: Tìm kiếm theo tên, email, mã NV, **số điện thoại** với bộ lọc nâng cao.
- **Quản lý Vòng đời**: Onboarding → Active → Terminated.
- **Hồ sơ Tài liệu**: Lưu trữ hợp đồng, bảo hiểm qua Supabase Storage.

### 2.7 Nghỉ phép & Chấm công & Lương
- Luồng phê duyệt: Nhân viên → Manager → HR/Admin.
- Bảng công: Ghi nhận giờ vào/ra, tính trạng thái đi muộn.
- Phiếu lương: Lương cơ bản + phụ cấp − khấu trừ.
- **Payroll Function**: `calculate_net_salary()` tính lương thực nhận theo dữ liệu chấm công thực tế.

### 2.8 Giao diện Dashboard & UI/UX
- Bento Grid Layout, Collapsible Sidebar, Real-time Notifications, Modern Login với Wave Gradient + Glassmorphism.
- Framer Motion page transitions, Ant Design 5 Components (Steps, Timeline, Drawer, Popover).

---

## 3. Cơ sở dữ liệu (Database Schema)

| Bảng | Mô tả |
|---|---|
| `profiles` | Thông tin nhân viên (mở rộng academic_background, work_experience, work_schedule JSONB) |
| `departments` & `designations` | Cơ cấu tổ chức |
| `leave_requests` | Đơn nghỉ phép và trạng thái phê duyệt |
| `attendance_records` & `payslips` | Dữ liệu công và lương |
| `job_applications` | Hồ sơ ứng viên ATS với pipeline stages |
| `system_notifications` | Thông báo hệ thống (Phase 2) |
| `audit_logs` | Nhật ký hoạt động |

### PostgreSQL Functions & RPCs
- `convert_applicant_to_employee(p_application_id, p_hired_by_id)` — Chuyển đổi ứng viên thành nhân viên
- `calculate_net_salary(p_profile_id, p_year, p_month)` — Tính lương thực nhận từ dữ liệu chấm công
- `notify_on_leave_request()` — Trigger tạo notification cho HR/Admin
- `notify_on_application()` — Trigger tạo notification khi có ứng viên mới

### Supabase Edge Functions
- `send-invite` — Gửi email lời mời ứng tuyển HTML đầy đủ thương hiệu qua Resend API

---

## 4. Bảo mật

- **Row Level Security (RLS)**: Áp dụng cho tất cả bảng. Ứng viên chỉ INSERT, HR/Admin đọc/ghi toàn bộ, nhân viên chỉ xem dữ liệu của mình.
- **Storage Bucket**: `candidate_resumes` (public), `employee_documents` (private signed URLs).
- **SECURITY DEFINER functions**: Tất cả RPCs chạy với quyền owner, không expose qua RLS.

---

## 5. Cài đặt & Triển khai

### Yêu cầu
- Node.js 18+
- Tài khoản Supabase (`ap-southeast-1` region)
- Tài khoản Resend (SMTP email)

### Các bước triển khai

```bash
# 1. Cài đặt dependencies
npm install

# 2. Cấu hình biến môi trường
cp .env.example .env
# Điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY

# 3. Chạy migrations theo thứ tự trong Supabase SQL Editor
#    supabase/schema.sql
#    supabase/migration_rbac.sql
#    supabase/migration_phase2.sql

# 4. Cấu hình Supabase Edge Function Secrets
#    RESEND_API_KEY = re_xxxxx
#    APP_URL = https://yourdomain.com

# 5. Tạo Storage Buckets
#    candidate_resumes (public)
#    employee_documents (private)

# 6. Chạy development server
npm run dev

# 7. Build production
npm run build
```

### Biến môi trường

| Biến | Mô tả |
|---|---|
| `VITE_SUPABASE_URL` | Project URL từ Supabase Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Anon key công khai |
| `RESEND_API_KEY` | API key Resend (Edge Function Secret) |
| `APP_URL` | URL production (Edge Function Secret) |

---

## 6. Kiến trúc Thư mục

```
src/
├── features/
│   ├── auth/           # AuthContext, LoginPage, ForgotPassword, ResetPassword
│   ├── employees/      # Directory, Detail, AddEmployee, EditEmployee
│   ├── recruitment/    # ATS: PublicJobApplicationPage, RecruitmentManagementPage
│   ├── leave-management/
│   ├── attendance/
│   └── payroll/
├── pages/
│   ├── DashboardPage
│   ├── ApprovalCenterPage     # Phase 2
│   └── DepartmentManagementPage
├── components/
│   └── layout/         # Sidebar, TopBar (notifications), AppLayout
├── hooks/
│   └── useNotifications.js    # Phase 2: system_notifications + mark read
└── lib/
    └── supabaseClient.js      # Auth helpers: signUp, resetPassword, updatePassword

supabase/
├── schema.sql
├── migration_rbac.sql
├── migration_phase2.sql       # Phase 2: ATS, notifications, payroll function
└── functions/
    └── send-invite/           # Edge Function: Resend email lời mời
```
