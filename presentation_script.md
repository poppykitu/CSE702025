# PeopleHub HRM - Danh mục Chức năng & Kịch bản Sử dụng

Tài liệu này tổng hợp toàn bộ các tính năng cốt lõi của PeopleHub HRM và các kịch bản thực tế giúp người dùng nắm vững quy trình vận hành hệ thống.

---

## 1. Danh sách Chức năng Hệ thống (Feature List)

### 1.1 Trung tâm Điều phối (Dashboard)
- **Bento Matrix Layout**: Giao diện tổng hợp dữ liệu theo dạng khối, tự động thích ứng với mọi thiết bị.
- **Thống kê thời gian thực**: Theo dõi số lượng nhân sự, trạng thái đi làm, và các chỉ số quỹ lương ngay lập tức.
- **Bảng tin hoạt động**: Liệt kê các sự kiện mới nhất (nhân viên mới, người đi muộn, đơn nghỉ phép vừa gửi).
- **Hệ thống thông báo thông minh**: Biểu tượng chuông trên TopBar tích hợp Popover hiển thị các yêu cầu chờ phê duyệt (Pending Requests).

### 1.2 Quản lý Nhân sự (Employee Lifecycle)
- **Employee Directory**: Danh sách nhân viên toàn công ty với bộ lọc thông minh (Phòng ban, Chức danh, Trạng thái).
- **Hồ sơ chi tiết**: Quản lý thông tin định danh, hợp đồng lao động, bảo hiểm và quá trình công tác.
- **Trạng thái Onboarding/Active/Offboarding**: Theo dõi toàn bộ vòng đời của nhân viên tại doanh nghiệp.

### 1.3 Quản lý Nghỉ phép (Leave Management)
- **Hệ thống nộp đơn (Self-service)**: Nhân viên tự nộp đơn nghỉ phép trực tuyến với lý do và khoảng thời gian cụ thể.
- **Quy trình phê duyệt tự động**: Thông báo gửi đến quản lý có thẩm quyền để Xem xét (Review) -> Phê duyệt (Approve) hoặc Từ chối (Reject).
- **Theo dõi số dư phép**: Hệ thống hóa ngày nghỉ còn lại của từng cá nhân.

### 1.4 Quản lý Chấm công & Lương bổng
- **Bảng chấm công 7 ngày (Week-view)**: Theo dõi chi tiết giờ vào/ra, cảnh báo đi muộn/về sớm.
- **Phiếu lương điện tử (E-Payslips)**: Nhân viên tra cứu lương hàng tháng với đầy đủ các khoản khấu trừ và bảo hiểm.

### 1.5 Bảo mật & Phân quyền (Security & RBAC)
- **Role-based Access Control (RBAC)**: Phân quyền chặt chẽ giữa Admin, HR, Manager và Employee.
- **Row Level Security (RLS)**: Bảo mật dữ liệu ở mức độ cơ sở dữ liệu, đảm bảo tuyệt đối tính riêng tư cho nhân sự.

---

## 2. Kịch bản Sử dụng (Common User Scenarios)

### Kịch bản 1: Nhân viên mới gia nhập (Onboarding Workflow)
*   **Mục tiêu**: Đưa nhân viên mới vào hệ thống và khởi tạo hồ sơ.
*   **Quy trình**:
    1.  Admin tạo tài khoản người dùng và thiết lập vai trò ban đầu là **Onboarding**.
    2.  Hệ thống yêu cầu nhân viên cập nhật thông tin cá nhân và tải lên các giấy tờ cần thiết.
    3.  HR kiểm tra tính pháp lý và chuyển trạng thái sang **Active** để bắt đầu quy trình chấm công.

### Kịch bản 2: Quy trình Phê duyệt Nghỉ phép
*   **Mục tiêu**: Đảm bảo nhân viên có thể nghỉ phép mà không gián đoạn hoạt động phòng ban.
*   **Quy trình**:
    1.  Nhân viên nộp đơn nghỉ phép qua cổng Self-service.
    2.  Admin/HR nhận thông báo đỏ trên biểu tượng chuông (TopBar).
    3.  Quản lý vào Dashboard, click vào thông báo và nhấn "Approve" sau khi kiểm tra lịch công tác.
    4.  Nhân viên nhận thông báo đơn đã được phê duyệt thành công.

### Kịch bản 3: Theo dõi Hiệu suất & Kỷ luật Lao động
*   **Mục tiêu**: Kiểm soát tình trạng đi muộn và đảm bảo kỷ luật.
*   **Quy trình**:
    1.  Hàng sáng, Admin kiểm tra 'Hoạt động mới' trên Dashboard để thấy danh sách đi muộn theo thời gian thực.
    2.  Hệ thống tự động ghi nhận vào Bảng chấm công tuần của nhân viên đó.
    3.  Cuối tháng, HR trích xuất dữ liệu từ bảng chấm công để tính lương một cách minh bạch.

### Kịch bản 4: Tra cứu Bảo mật (Hồ sơ Lương & Hợp đồng)
*   **Mục tiêu**: Cung cấp khả năng tự tra cứu thông tin cá nhân một cách an toàn.
*   **Quy trình**:
    1.  Nhân viên đăng nhập vào hệ thống với bảo mật SSL và RLS.
    2.  Truy cập phân hệ 'Bảng lương' để xem phiếu lương tháng gần nhất.
    3.  Dù là đồng nghiệp trong cùng phòng ban, RLS đảm bảo nhân viên này không bao giờ thấy được bảng lương của người khác.
