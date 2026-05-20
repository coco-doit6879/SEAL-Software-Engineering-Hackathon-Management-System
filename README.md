# SEAL – Software Engineering Hackathon Management System (SEAL-HMS)

Hệ thống quản lý và chấm điểm cuộc thi SEAL Hackathon cho Khoa Kỹ thuật Phần mềm và PDP tại Đại học FPT TP.HCM, kết hợp thu thập dữ liệu nghiên cứu khoa học về độ nhất quán liên đánh giá viên (RBL).

## Cấu trúc dự án (Repository Structure)

Dự án được chia thành 2 phần chính:
- **`backend/`**: Xây dựng bằng ExpressJS, TypeScript, Prisma ORM và cơ sở dữ liệu PostgreSQL.
- **`frontend/`**: Xây dựng bằng Next.js (App Router), TypeScript và Tailwind CSS.

## Hướng dẫn cài đặt nhanh (Quick Setup)

### Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản v18 trở lên)
- [Docker](https://www.docker.com/) (để chạy PostgreSQL cục bộ qua Docker Compose) hoặc dịch vụ PostgreSQL cài đặt sẵn trên máy.

### 1. Khởi chạy Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Lưu ý: Điều chỉnh thông số `DATABASE_URL` kết nối tới PostgreSQL của bạn.*
4. Chạy các câu lệnh cập nhật Database (Prisma Migrations) và sinh client:
   ```bash
   npx prisma migrate dev
   ```
5. Chạy seed dữ liệu mẫu (các vai trò, sự kiện mặc định):
   ```bash
   npm run seed
   ```
6. Khởi chạy server ở chế độ phát triển (Development mode):
   ```bash
   npm run dev
   ```
   *Backend sẽ chạy ở cổng `http://localhost:5000` (hoặc cổng cấu hình trong `.env`).*

### 2. Khởi chạy Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env.local` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Khởi chạy frontend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Frontend Next.js sẽ chạy ở cổng `http://localhost:3000`.*

---

## Phân công phát triển (Team Work Distribution)
- **Backend Developers**: Xem chi tiết cấu trúc routes tại `backend/src/routes/` và triển khai các API Endpoints.
- **Frontend Developers**: Thiết kế các trang giao diện (Student, Coordinator, Judge, Mentor) tại `frontend/src/app/` sử dụng các UI components dùng chung tại `frontend/src/components/`.

Vui lòng xem chi tiết kế hoạch triển khai tại tệp tài liệu dự án để biết thêm chi tiết.
