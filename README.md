# PeopleHub HRM - Hệ thống Quản trị Nguồn nhân lực Chuyên nghiệp

Hệ thống PeopleHub HRM là một giải pháp quản trị nhân sự (HRM) cấp doanh nghiệp, được xây dựng dựa trên các tiêu chuẩn chuyên nghiệp của Zoho People. Ứng dụng tập trung vào tính bảo mật, quy trình phê duyệt chặt chẽ và trải nghiệm người dùng tối ưu.

## Các Tính năng Cốt lõi

### 1. Quản lý Hồ sơ Nhân sự (Employee Profile Management)
- Directory nhân viên với bộ lọc đa tiêu chí (Phòng ban, Chức danh, Trạng thái).
- Quản lý vòng đời nhân viên từ khi vào làm (Onboarding) đến khi nghỉ việc (Terminated).
- Lưu trữ hồ sơ tài liệu bảo mật gồm Hợp đồng lao động, Bảo hiểm và Giấy tờ định danh.

### 2. Quản lý Nghỉ phép (Leave Management)
- Hệ thống nộp đơn nghỉ phép tự phục vụ cho nhân viên.
- Quy trình phê duyệt đa cấp (Manager/HR/Admin).
- Tích hợp phản hồi/ghi chú khi phê duyệt hoặc từ chối đơn.

### 3. Chấm công & Bảng lương (Attendance & Payroll)
- Tra cứu bảng công cá nhân theo thời gian thực (Giờ vào/ra, trạng thái đi muộn).
- Theo dõi phiếu lương hàng tháng với chi tiết lương cơ bản, phụ cấp và các khoản khấu trừ.

### 4. Hệ thống Phân quyền (RBAC) & Bảo mật
- Phân quyền dựa trên 4 vai trò chính: Admin, HR, Manager, và Employee.
- Cơ chế Row Level Security (RLS) của Supabase đảm bảo dữ liệu chỉ được truy cập bởi đúng đối tượng có thẩm quyền.

### 5. Nhật ký Hệ thống (Audit Logging)
- Tự động ghi lại toàn bộ các hành động nhạy cảm (Đăng nhập, cập nhật hồ sơ, phê duyệt đơn).
- Báo cáo nhật ký minh bạch phục vụ công tác kiểm tra và quản trị.

## Danh mục Công nghệ

- **Frontend**: React.js (Vite), JavaScript, Framer Motion (Page Transitions).
- **Styling**: Tailwind CSS, Ant Design (Components).
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **State Management**: TanStack Query (React Query).

## Hướng dẫn Cài đặt

1. Kiểm tra môi trường Node.js.
2. Clone mã nguồn và cài đặt dependencies:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường trong file `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Chạy ứng dụng ở chế độ phát triển:
   ```bash
   npm run dev
   ```

## Kiến trúc Mã nguồn

Hệ thống được tổ chức theo cấu trúc tính năng (Feature-based Architecture) giúp dễ dàng mở rộng:
- `src/features/auth`: Xác thực và phân quyền.
- `src/features/employees`: Quản lý danh sách và hồ sơ nhân viên.
- `src/features/leave-management`: Luồng phê duyệt nghỉ phép.
- `src/features/attendance`: Module chấm công.
- `src/features/payroll`: Module lương bổng.
- `src/services`: Các dịch vụ dùng chung (Audit, Storage).
