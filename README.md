# Module Quản lý Hồ sơ Nhân viên - Zoho Clone

## Giới thiệu Tổng quan

Module Quản lý Hồ sơ Nhân viên (Employee Directory) là một hệ thống con thuộc nền tảng Enterprise Resource Planning (ERP) và cấu trúc Nhân sự cốt lõi (Core HR). Giải pháp này được thiết kế dựa trên nguồn cảm hứng từ kiến trúc hiển thị của Zoho People, cung cấp không gian làm việc tập trung để lưu trữ, giám sát, và quản lý vòng đời nhân sự (Employee Lifecycle) từ lúc gia nhập đến khi chấm dứt hợp đồng.

Mục tiêu chính yếu của phân hệ là tạo ra một môi trường dữ liệu thống nhất (Single Source of Truth), giảm thiểu tối đa sự phân tán trong quy trình lưu trữ hồ sơ, cũng như hỗ trợ hoạt động quản trị nguồn nhân lực bằng các công cụ truy xuất và định tuyến thông tin chính xác, bảo mật.

---

## Kiến trúc và Công nghệ (Tech Stack)

Hệ thống được phát triển theo mô hình Client-Server dựa trên các nền tảng công nghệ và thư viện hiện đại để đảm bảo hiệu suất xử lý dữ liệu và tính tương tác của Giao diện người dùng (UI):

- **Core Framework:** React 19 kết hợp với Vite (Build tool tốc độ cao dành cho Frontend).
- **Ngôn ngữ lập trình:** JavaScript (ECMAScript 2022+).
- **Giao diện người dùng (UI/UX):** Ant Design 5 (Enterprise Component Library) kết hợp với Tailwind CSS cho việc cấu hình vi chỉnh Component CSS.
- **Micro-interactions:** Animations và các Design Tokens (Variable CSS) được quản lý đồng bộ nhằm tái hiện chi tiết chuẩn mực thiết kế (Enterprise Aesthetics).
- **Data Fetching và State Management:** TanStack Query (React Query v5) quản lý bộ đệm (Cache), tối ưu hóa các lệnh gọi API đa tầng.
- **Routing:** React Router v6.
- **Backend as a Service (BaaS) và Cơ sở dữ liệu:** Supabase.
  - **Database:** PostgreSQL kèm hệ thống bảo mật cấp độ hàng (Row Level Security - RLS).
  - **Storage:** Quản lý tệp tin đa phương tiện và ảnh đại diện (Avatars).
  - **Authentication:** Tích hợp quản lý phiên làm việc thông qua JSON Web Token (JWT).

---

## Kịch bản Chức năng Cốt lõi

Các tính năng được phân rã thành những luồng xử lý chính như sau:

1. **Quản lý danh sách nhân sự (Directory Listing):** 
   - Hỗ trợ xem dạng Lưới (Grid view) cho trải nghiệm hình ảnh tổng quan và dạng Danh sách (List view) phục vụ truy xuất dữ liệu tuyến tính.
   - Thể hiện các biểu tượng trạng thái chuyên biệt cho các giai đoạn khác nhau trong vòng đời nhân sự.

2. **Tìm kiếm và Bộ lọc Nâng cao (Advanced Discoverability):**
   - Hỗ trợ công cụ tìm kiếm toàn văn bản (Full-text Search).
   - Truy xuất hồ sơ phức hợp dựa trên Phòng ban chức năng, Trạng thái hoạt động, và Loại hình biên chế.

3. **Chi tiết Hồ sơ Nhân sự (Employee Lifecycle Record):**
   - Tập hợp Thông tin phân bổ cấp bậc quản lý (Employment details), Định danh hệ thống và Thông tin nhân khẩu học (Personal details) theo cấu trúc các thẻ lồng (Tab).
   - Giao thức xử lý chấm dứt hợp đồng nhân sự (Termination workflow) được thiết kế an toàn, với cơ chế xác minh thứ cấp.

4. **Khai báo và Cập nhật (Onboarding & Mutation):**
   - Biểu mẫu định dạng kỹ thuật số áp dụng cơ chế xác thực đầu vào (Validation) thời gian thực.
   - Cơ chế chọn lọc dữ liệu phân cấp, trong đó cấp bậc nghiệp vụ (Designation) phụ thuộc vào phòng ban chức năng (Department) hiện hành.
   - Tích hợp công cụ tải và xử lý hình ảnh đại diện liên kết trực tiếp với máy chủ lưu trữ (Supabase Storage).

---

## Cấu trúc Mã nguồn (Project Structure)

Dự án sử dụng phương pháp luận lấy Tính năng làm trung tâm (Feature-based/Module-based Architecture) nhằm hỗ trợ việc bảo trì và mở rộng nghiệp vụ trong tương lai:

```text
CSE702025/
├── supabase/
│   └── schema.sql                # Định nghĩa DDl, RLS policies, Functions, và Seed data
├── src/
│   ├── components/               # Các cấu kiện UI phân tách nghiệp vụ
│   │   ├── common/               # Component dùng chung (Skeleton, Empty state, Toggle View)
│   │   ├── employee/             # Component định dạng nhân viên (Card, List item, Avatar, Badge)
│   │   ├── filter/               # Component xử lý truy vấn (Sidebar Panel, Searchbar)
│   │   ├── form/                 # Component xử lý nhập liệu chuyên sâu
│   │   └── layout/               # Component định hình khung giao diện (TopBar, Wrapper)
│   ├── context/                  # Trạng thái toàn cục (Global State) - Quản lý Auth Session
│   ├── hooks/                    # Trình bao bọc Logic sử dụng TanStack Query (Data Fetching layer)
│   ├── pages/                    # Các màn hình tương tác chính trong quy trình (Routing endpoints)
│   ├── services/                 # Triển khai tầng giao tiếp với Supabase Server (Service pattern)
│   ├── utils/                    # Các hàm hỗ trợ nghiệp vụ tinh gọn (Helpers) và siêu dữ liệu (Constants)
│   ├── lib/                      # Khởi tạo và thiết lập thư viện bên thứ 3 (Supabase Client)
│   ├── App.jsx                   # Khai báo tuyến đường ứng dụng (Router Provider)
│   └── main.jsx                  # Điểm neo hệ thống (Entry point) gắn kết Context Provider
```

---

## Mô tả Tệp Mã nguồn Chuyên sâu

| Đường dẫn tập tin | Chức năng Kỹ thuật và Nghiệp vụ cốt lõi |
| :--- | :--- |
| `src/services/employeeService.js` | Tầng tương tác CSDL quản lý hồ sơ ứng viên; bao gồm hai chế độ hoạt động: Môi trường cơ sở dữ liệu vật lý (PostgreSQL) và Dữ liệu giả lập (Mock fallback). Chứa các nghiệp vụ CRUD và Storage Upload. |
| `src/hooks/useEmployees.js` | Phân lớp Custom Hook trừu tượng hóa lệnh gọi API bằng TanStack Query; thiết lập bộ đệm (Caching rules) định kỳ, tự động vô hiệu hóa khóa (Invalidation keys) khi xảy ra Mutation. |
| `src/components/form/EmployeeForm.jsx` | Khối Component quản lý luồng dữ liệu hai chiều (Two-way binding) áp dụng Validation rules đa tầng. Quản lý tác vụ tạo mới và tái định dạng thông tin hiện hữu (Edit Mode). |
| `src/pages/EmployeeDetail.jsx` | Hiển thị thông tin đặc thù của định danh cá nhân nhân viên, cho phép thực thi tác vụ kiểm duyệt như thay đổi trạng thái làm việc dựa trên mã ID thu nhận từ Router. |
| `src/pages/EmployeeDirectory.jsx` | Layout chính quy tập toàn bộ các cấu kiện: Filter Sidebar, Search Controller và Viewport phân vùng (List/Grid). |
| `src/utils/constants.js` | Lưu trữ bộ tham số cấu hình tĩnh (Enums) phục vụ mapping trạng thái logic với thuật ngữ nhân sự và biểu đạt giao diện (Label/Colors). |
| `src/lib/supabaseClient.js` | Kết nối phân đoạn với máy chủ ngoại vi qua SDK. Tích hợp khả năng ghi log dự phòng (Fallback Gracefully) khi thiếu thông tin xác thực. |

---

## Thiết kế Cơ sở Dữ liệu (Database Schema)

Hệ thống được biên dịch dựa trên PostgreSQL với mô hình thực thể mối quan hệ (ERD). Gồm ba thực thể chính, được liên kết chặt chẽ qua Constraints và RLS Policies.

```sql
-- Thực thể: departments (Đơn vị cấu trúc)
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code        VARCHAR(20) UNIQUE
);

-- Thực thể: designations (Hệ thống cấp bậc chuyên môn)
CREATE TABLE designations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  level         INTEGER DEFAULT 1,
  UNIQUE(title, department_id)
);

-- Thực thể: profiles (Định danh nhân sự/Hồ sơ)
CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id       VARCHAR(20) UNIQUE NOT NULL,
  full_name         VARCHAR(200) NOT NULL,
  email             VARCHAR(320) UNIQUE NOT NULL,
  phone             VARCHAR(30),
  avatar_url        TEXT,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation_id    UUID REFERENCES designations(id) ON DELETE SET NULL,
  manager_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status            employee_status NOT NULL DEFAULT 'onboarding',
  work_type         work_type NOT NULL DEFAULT 'full-time',
  date_of_joining   DATE
  -- ... Personal Attributes (Gender, Address, Context Variables)
);
```

---

## Hướng dẫn Vận hành và Triển khai (Deployment Guide)

### 1. Phục chế Dữ liệu Mã nguồn (Repository Cloning)

Yêu cầu môi trường máy chủ cài đặt sẵn hệ sinh thái Node.js (phiên bản bảo lưu LTS) và Git.

```bash
git clone https://github.com/poppykitu/CSE702025.git
cd CSE702025
```

### 2. Thiết lập Môi trường Biến số (Dependencies & Environment Setup)

```bash
npm install
```

Tạo bản sao định dạng danh mục tham số hệ thống và điền định danh tài khoản Supabase:

```bash
cp .env.example .env
```

*Trong tệp `.env`, ghi đè các tham chiếu sau bằng khóa phân quyền thực tế:*
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

Cơ sở hạ tầng phần mềm cũng yêu cầu khởi tạo kho bản ghi dữ liệu mẫu nằm tại tệp `supabase/schema.sql` thông qua màn hình Console điều khiển của dịch vụ Supabase.

### 3. Thực thi Môi trường Phát triển Kỹ thuật (Local Development)

Tiến hành phát trình phân tích mã nguồn chạy ngầm theo cơ chế phản hồi tương tác (Hot Module Replacement) của Vite.

```bash
npm run dev
```

Hệ thống sẽ được khởi chạy tại phân vùng mặc định: `http://localhost:5173`.
Tương tác trực quan sẵn sàng cho các công tác phản biện thiết kế sản phẩm và kiểm tra chất lượng (QA).
