# Kịch bản Thuyết trình Kỹ thuật: Hệ thống PeopleHub HRM

## 1. Giới thiệu Tổng quan
Kính thưa Hội đồng và quý đồng nghiệp, tôi xin phép trình bày về hệ thống PeopleHub HRM - một nền tảng Quản trị Nguồn nhân lực toàn diện được xây dựng theo kiến trúc hướng tính năng (Feature-based Architecture) và tiêu chuẩn bảo mật doanh nghiệp.

## 2. Kiến trúc Hệ thống và Tổ chức Mã nguồn
Hệ thống được thiết kế nhằm đảm bảo khả năng mở rộng và bảo trì dễ dàng. Thay vì phân loại theo kiểu truyền thống (components, pages), chúng tôi tổ chức theo các Module nghiệp vụ (Features):
- **Auth Feature**: Quản lý toàn bộ vòng đời xác thực của người dùng và tích hợp Hook kiểm tra quyền hạn (usePermission).
- **Employee Feature**: Tập trung vào việc quản lý dữ liệu nhân sự, tích hợp lưu trữ hồ sơ tài liệu bảo mật.
- **Leave Management Feature**: Xử lý quy trình phê duyệt nghỉ phép phức tạp.
- **Attendance & Payroll**: Các module mới phục vụ nhu cầu tự tra cứu của nhân viên.

Mối tương quan (Mapping):
- Giao diện người dùng được xây dựng bằng React.js và Ant Design.
- Lớp dữ liệu và logic bảo mật được thực thi trực tiếp tại cơ sở dữ liệu Supabase thông qua hệ thống RLS (Row Level Security).

## 3. Hệ thống Phân quyền dựa trên Vai trò (RBAC)
Đây là hạt nhân bảo mật của hệ thống. Chúng tôi triển khai 4 cấp độ quyền hạn:
- **Admin**: Kiểm soát toàn bộ cấu hình hệ thống và nhật ký Audit.
- **HR**: Chịu trách nhiệm quản lý hồ sơ nhân viên, tài liệu và ghi nhận các biến động nhân sự.
- **Manager**: Có quyền giám sát và phê duyệt đơn từ của nhân viên thuộc phòng ban mình quản lý.
- **Employee**: Quyền truy cập tự phục vụ vào hồ sơ cá nhân, bảng công và bảng lương.

Kỹ thuật triển khai: Toàn bộ các truy vấn dữ liệu đều đi qua middleware phân quyền tại tầng Database, đảm bảo ngay cả khi có lỗ hổng ở Frontend, dữ liệu nhạy cảm vẫn được bảo vệ tuyệt đối.

## 4. Nhật ký Hệ thống (Audit Logging) và Quy trình Phê duyệt
Để đáp ứng các tiêu chuẩn quản trị chuyên nghiệp, hệ thống đã tích hợp module Audit Logging. Mọi thao tác như cập nhật thông tin lương, thay đổi trạng thái nhân viên đều được hệ thống tự động lưu vết (Action, Actor, Timestamp, Diff data).

Quy trình phê duyệt nghỉ phép đã được nâng cấp để hỗ trợ tương tác hai chiều. Cấp trên khi phê duyệt hoặc từ chối đơn bắt buộc phải để lại phản hồi hoặc lý do, giúp minh bạch hóa các quyết định quản lý.

## 5. Quản lý Tài liệu và Tra cứu Cá nhân
Hệ thống sử dụng Supabase Storage với cơ chế Private Bucket để lưu trữ Hợp đồng, Bảo hiểm. Chỉ những người dùng có thẩm quyền (HR/Admin) hoặc chính nhân viên sở hữu tài liệu đó mới có link truy cập tạm thời để xem hoặc tải xuống.

Tính năng tra cứu Bảng công và Bảng lương giúp giảm tải đáng kể cho bộ phận HCNS, đồng thời tăng tính chủ động cho nhân viên trong việc theo dõi thu nhập và ngày công lao động.

## 6. Kết luận
Hệ thống PeopleHub HRM không chỉ là một ứng dụng quản lý dữ liệu đơn thuần, mà còn là một minh chứng cho việc kết hợp giữa kiến trúc phần mềm hiện đại (React, Supabase) và các chuẩn mực quản trị hành chính chuyên nghiệp.

Xin cảm ơn sự chú ý theo dõi của quý vị.
