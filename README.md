# PeopleHub HRM - Hệ thống Quản trị Nguồn nhân lực Chuyên nghiệp

Hệ thống PeopleHub HRM là một giải pháp quản trị nhân sự (HRM) cấp doanh nghiệp, được thiết kế và xây dựng dựa trên các tiêu chuẩn chuyên nghiệp của Zoho People. Ứng dụng tập trung vào tính bảo mật, quy trình phê duyệt chặt chẽ, và kiến trúc hướng tính năng (Feature-based Architecture) để đảm bảo khả năng mở rộng tối đa.

## 1. Hệ thống Phân quyền (RBAC Structure)
Hệ thống được xây dựng trên 4 cấp độ ủy quyền nghiêm ngặt, đảm bảo tính toàn vẹn và bảo mật dữ liệu:

- **Quản trị viên hệ thống (Admin)**: Toàn quyền kiểm soát cấu hình hệ thống, quản lý tài khoản người dùng và truy cập toàn bộ nhật ký Audit Logs để giám sát hoạt động.
- **Quản lý nhân sự (HR)**: Quản lý hồ sơ nhân viên toàn diện (Hợp đồng, bảo hiểm, lương bổng), phê duyệt các yêu cầu trên toàn công ty và quản lý tài liệu lưu trữ.
- **Quản lý bộ phận (Manager)**: Xem hồ sơ cơ bản của nhân viên trực thuộc và phê duyệt các đơn từ (nghỉ phép, tăng ca) trong phạm vi phòng ban được phân bổ.
- **Nhân viên (Employee)**: Tự tra cứu thông tin cá nhân, nộp đơn nghỉ phép, xem bảng công và bảng lương cá nhân thông qua cơ chế tự phục vụ (Self-service).

## 2. Các Phân hệ Chức năng Chính

### 2.1 Quản lý Hồ sơ & Vòng đời Nhân sự
- **Employee Directory**: Danh sách nhân viên với bộ lọc nâng cao theo Phòng ban, Chức danh và Trạng thái.
- **Quản lý Vòng đời**: Hệ thống hóa trạng thái nhân viên từ lúc **Onboarding** (Đang tiếp nhận), **Active** (Đang làm việc) cho đến khi **Terminated** (Đã nghỉ việc).
- **Hồ sơ Tài liệu (Compliance)**: Lưu trữ bảo mật các tệp tin Hợp đồng lao động, Bảo hiểm và Giấy tờ định danh thông qua Supabase Storage với link truy cập có thời hạn.

### 2.2 Quản lý Nghỉ phép (Approval Workflow)
- Luồng phê duyệt thông minh: Nhân viên nộp đơn -> Quản lý trực tiếp xem xét -> HR/Admin xác nhận cuối cùng.
- Tích hợp tính năng phản hồi/lý do trực tiếp khi phê duyệt hoặc từ chối đơn để đảm bảo tính minh bạch.

### 2.3 Chấm công & Lương bổng (Self-Service)
- **Bảng công**: Hệ thống ghi nhận giờ vào/ra, tính toán trạng thái đi muộn hoặc về sớm theo thời gian thực.
- **Bảng lương**: Phiếu lương chi tiết hàng tháng gồm lương cơ bản, phụ cấp, các khoản khấu trừ và thuế.

### 2.4 Giao diện Dashboard & UI/UX Đột phá
- **Bento Grid Layout**: Dashboard thông minh tự động thay đổi theo kích thước màn hình, hiển thị các chỉ số quan trọng (Quỹ lương, Điểm danh, Hoạt động mới) một cách trực quan.
- **Collapsible Sidebar**: Thanh điều hướng có khả năng thu gọn linh hoạt, tối ưu hóa không gian làm việc cho Admin.
- **Real-time Notifications**: Hệ thống thông báo tức thời trên TopBar giúp quản trị viên nhận biết ngay khi có đơn nghỉ phép hoặc sự kiện mới cần xử lý.
- **Modern Login Experience**: Trang đăng nhập sử dụng công nghệ **Wave Gradient** động với phong cách **Glassmorphism**, mang lại ấn tượng chuyên nghiệp ngay từ điểm chạm đầu tiên.

### 2.5 Nhật ký hệ thống (Audit Logging)
- Tự động ghi vết mọi thao tác nhạy cảm liên quan đến thay đổi dữ liệu nhân sự, tài chính và truy cập hệ thống.

## 3. Cấu trúc Cơ sở dữ liệu (Database Schema)
Hệ thống sử dụng PostgreSQL trên nền tảng Supabase với các bảng chính:
- `profiles`: Lưu trữ thông tin định danh và vai trò người dùng.
- `employees`: Thông tin chi tiết hồ sơ nhân sự và trạng thái làm việc.
- `departments` & `designations`: Quản lý cơ cấu tổ chức.
- `leave_requests`: Lưu trữ đơn từ và trạng thái phê duyệt.
- `attendance_records` & `payslips`: Dữ liệu công và lương.
- `audit_logs`: Nhật ký hoạt động hệ thống.

## 4. Bảo mật và Công nghệ

- **Row Level Security (RLS)**: Cơ chế bảo mật tầng thấp nhất tại Database, đảm bảo dữ liệu chỉ hiển thị đúng cho đối tượng có thẩm quyền.
- **Tech Stack**:
  - **Frontend**: React.js (Vite), Framer Motion.
  - **UI Library**: Ant Design (Premium UI Components).
  - **Backend**: Supabase (PostgreSQL, Auth, Storage).
  - **State Management**: TanStack Query (React Query).

## 5. Hướng dẫn Triển khai

1. **Cài đặt môi trường**: Yêu cầu Node.js phiên bản mới nhất.
2. **Cài đặt Dependencies**:
   ```bash
   npm install
   ```
3. **Cấu hình Supabase**:
   - Tạo các bảng theo schema cung cấp trong thư mục `supabase/`.
   - Cấu hình RLS Policies cho các vai trò Admin, HR, Manager, Employee.
   - Tạo Storage Bucket `employee_documents` ở chế độ Private.
4. **Biến môi trường (.env)**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Chạy ứng dụng**:
   ```bash
   npm run dev
   ```

## 6. Kiến trúc Thư mục (Architecture)
Hệ thống tuân thủ cấu trúc hướng tính năng:
- `src/features/[feature-name]`: Chứa UI components, hooks, services và logic riêng cho từng phân hệ.
- `src/components/layout`: Chứa cấu trúc khung Dashboard, Sidebar (Bento Design) và Topbar.
- `src/context`: Quản lý trạng thái xác thực và phân quyền toàn cục.
