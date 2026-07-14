import nodemailer from 'nodemailer';

// Helper to check if credentials are set
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    // If not set, return null so we can mock/fallback gracefully without crashing
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const emailService = {
  /**
   * Generic sender method. Falls back to console log mock in development if credentials are not configured.
   */
  async sendEmail(to: string, subject: string, htmlContent: string) {
    const transporter = getTransporter();

    if (!transporter) {
      console.log('------------------------------------------------------------');
      console.log(`[EMAIL MOCK] (Set EMAIL_USER & EMAIL_PASS in .env to send actual emails via Gmail)`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${htmlContent.replace(/<[^>]*>/g, '')}`);
      console.log('------------------------------------------------------------');
      return { mocked: true };
    }

    try {
      const info = await transporter.sendMail({
        from: `"SEAL Hackathon HMS" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[EMAIL SENT] Email successfully sent to ${to}. MessageId: ${info.messageId}`);
      return { messageId: info.messageId };
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error);
      throw error;
    }
  },

  /**
   * Send notification for team status updates (Approved / Disqualified)
   */
  async sendTeamStatusEmail(
    to: string,
    leaderName: string,
    teamName: string,
    status: 'APPROVED' | 'DISQUALIFIED',
    reason?: string
  ) {
    const subject = `[SEAL Hackathon 2026] Thông báo trạng thái Đội thi - ${teamName}`;
    const statusText = status === 'APPROVED' ? 'ĐÃ ĐƯỢC DUYỆT (APPROVED)' : 'BỊ LOẠI (DISQUALIFIED)';
    const statusColor = status === 'APPROVED' ? '#10B981' : '#EF4444';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">SEAL Hackathon Portal</h2>
        <p>Xin chào <strong>${leaderName}</strong>,</p>
        <p>Ban tổ chức SEAL Hackathon 2026 xin thông báo về trạng thái đăng ký của đội thi <strong>${teamName}</strong> như sau:</p>
        
        <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">Trạng thái: ${statusText}</span>
        </div>
        
        ${status === 'DISQUALIFIED' && reason ? `
          <p><strong>Lý do từ Ban tổ chức:</strong></p>
          <blockquote style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 10px 15px; margin: 10px 0; font-style: italic;">
            ${reason}
          </blockquote>
        ` : ''}
        
        <p>Nếu bạn có bất kỳ câu hỏi nào khác, vui lòng liên hệ Ban tổ chức qua email này hoặc trực tiếp trên Portal thông qua mục Trợ lý quy chế.</p>
        <br>
        <p>Trân trọng,<br><strong>Ban tổ chức SEAL Hackathon 2026</strong><br>Khoa Kỹ thuật Phần mềm - Đại học FPT TP.HCM</p>
      </div>
    `;

    return this.sendEmail(to, subject, htmlContent);
  },

  /**
   * Send notification for submission confirmation
   */
  async sendSubmissionConfirmationEmail(
    to: string,
    leaderName: string,
    teamName: string,
    roundName: string,
    repoUrl: string,
    demoUrl: string
  ) {
    const subject = `[SEAL Hackathon 2026] Xác nhận Nộp bài thành công - ${teamName} (${roundName})`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">SEAL Hackathon Portal</h2>
        <p>Xin chào <strong>${leaderName}</strong>,</p>
        <p>Hệ thống đã nhận được bài nộp của đội thi <strong>${teamName}</strong> cho <strong>${roundName}</strong> thành công.</p>
        
        <p><strong>Chi tiết thông tin bài nộp:</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 35%;">Link Repository (GitHub):</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="${repoUrl}">${repoUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Link Product Demo:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><a href="${demoUrl}">${demoUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Thời gian nộp bài:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString('vi-VN')}</td>
          </tr>
        </table>
        
        <p>Hội đồng giám khảo sẽ bắt đầu chấm điểm bài thi của các đội sau khi kết thúc hạn nộp bài. Chúc đội thi đạt kết quả tốt nhất!</p>
        <br>
        <p>Trân trọng,<br><strong>Ban tổ chức SEAL Hackathon 2026</strong></p>
      </div>
    `;

    return this.sendEmail(to, subject, htmlContent);
  },

  async sendTeamInvitationEmail(
    to: string,
    studentName: string,
    teamName: string,
    leaderName: string,
    eventName: string
  ) {
    const subject = `[SEAL Hackathon 2026] Lời mời tham gia Đội thi - ${teamName}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">SEAL Hackathon Portal</h2>
        <p>Xin chào <strong>${studentName}</strong>,</p>
        <p>Bạn đã nhận được lời mời tham gia đội thi <strong>${teamName}</strong> (Sự kiện: <strong>${eventName}</strong>) từ đội trưởng <strong>${leaderName}</strong>.</p>
        
        <p>Vui lòng đăng nhập vào hệ thống SEAL Hackathon Portal để xem chi tiết và phản hồi (Đồng ý hoặc Từ chối) lời mời này.</p>
        
        <p>Nếu bạn có bất kỳ câu hỏi nào khác, vui lòng liên hệ Ban tổ chức.</p>
        <br>
        <p>Trân trọng,<br><strong>Ban tổ chức SEAL Hackathon 2026</strong></p>
      </div>
    `;
    return this.sendEmail(to, subject, htmlContent);
  }
};
