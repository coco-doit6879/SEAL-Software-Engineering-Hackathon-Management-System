import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản sinh viên mới (STUDENT)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email sinh viên (ví dụ @fpt.edu.vn)
 *                 example: student_test@fpt.edu.vn
 *               password:
 *                 type: string
 *                 description: Mật khẩu bảo mật
 *                 example: Password123!
 *               fullName:
 *                 type: string
 *                 description: Họ và tên đầy đủ
 *                 example: Nguyễn Văn Test
 *               isFptStudent:
 *                 type: boolean
 *                 description: Có phải sinh viên FPT không
 *                 example: true
 *               studentCode:
 *                 type: string
 *                 description: Mã số sinh viên
 *                 example: SE170001
 *               university:
 *                 type: string
 *                 description: Trường đại học
 *                 example: FPT University HCMC
 *     responses:
 *       201:
 *         description: Đăng ký tài khoản thành công
 *       400:
 *         description: Thiếu trường bắt buộc hoặc Email đã được sử dụng
 * 
 * /auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: student1@fpt.edu.vn
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và trả về JWT Token
 *       401:
 *         description: Email hoặc mật khẩu không chính xác
 * 
 * /auth/me:
 *   get:
 *     summary: Xem thông tin chi tiết tài khoản hiện tại đang đăng nhập
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       401:
 *         description: Token không hợp lệ hoặc chưa đăng nhập
 */
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect as any, getMe as any);

export default router;
