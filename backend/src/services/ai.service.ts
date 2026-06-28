import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { scoreService } from './score.service';

// Initialize Gemini SDK helper
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw ApiError.internal('GEMINI_API_KEY is not configured in .env file.');
  }
  return new GoogleGenerativeAI(apiKey);
};

const SAMPLE_RULES = [
  {
    title: "1. Thể lệ nộp bài & Hạn chót (Deadline)",
    content: "Thí sinh phải nộp bài đúng hạn thông qua hệ thống SEAL-HMS. Đường dẫn bài nộp phải bao gồm Repo URL (GitHub) và Demo URL (ví dụ: Vercel, Netlify). Mọi bài nộp trễ hạn sau thời gian đóng link nộp bài (Submission Deadline) sẽ bị hệ thống tự động khóa và đánh dấu lỗi nộp muộn trừ khi có sự xác nhận đặc biệt từ Ban tổ chức (Coordinator). Trạng thái nộp bài thành công chỉ khi Đội trưởng (Leader) của đội bấm submit."
  },
  {
    title: "2. Quy định về Đội thi & Thành viên",
    content: "Mỗi đội thi phải có tối thiểu 3 thành viên và tối đa 5 thành viên. Mỗi đội thi phải bầu ra 1 Đội trưởng (Team Leader). Chỉ có Đội trưởng mới có quyền thay mặt đội nộp bài, chỉnh sửa thông tin bài nộp trên hệ thống. Các thành viên khác chỉ có quyền xem trạng thái. Trạng thái của đội thi phải được Coordinator duyệt (APPROVED) thì mới được phép tham gia nộp bài."
  },
  {
    title: "3. Tiêu chí chấm điểm & Trọng số",
    content: "Điểm số của mỗi vòng thi được chấm bởi Hội đồng giám khảo gồm các Giám khảo nội bộ (Internal Judge) và Giám khảo khách mời (Guest Judge). Tiêu chí chấm điểm bao gồm: Tiêu chí kỹ thuật (Technical Depth - chiếm 50% trọng số, ví dụ chất lượng code, kiến trúc hệ thống), Thiết kế giao diện (UI/UX - chiếm 20% trọng số), và Kỹ năng thuyết trình (Presentation/Pitching - chiếm 30% trọng số). Giám khảo chấm điểm độc lập trên thang điểm 10."
  },
  {
    title: "4. Cơ chế chấm thử (Calibration)",
    content: "Trước khi chấm chính thức các bài thi của các đội, Ban giám khảo bắt buộc phải thực hiện chấm thử một dự án mẫu (Calibration Sample). Mục tiêu là để tính toán chỉ số tương quan nội lớp ICC (Intraclass Correlation Coefficient) và Krippendorff's Alpha nhằm đo lường mức độ đồng thuận giữa các giám khảo. Nếu chỉ số ICC < 0.7, Coordinator sẽ yêu cầu hội đồng họp thảo luận lại thang tiêu chí để đồng bộ cách đánh giá."
  },
  {
    title: "5. Cơ chế đi tiếp & Loại trừ (Progression)",
    content: "Sau khi kết thúc mỗi vòng đấu, dựa trên bảng xếp hạng (Leaderboard) được tính theo trung bình điểm có trọng số từ các giám khảo, hệ thống sẽ lọc ra Top N đội có điểm cao nhất của từng Track (được cấu hình bởi thuộc tính topNToProgress của vòng đó) để chuyển thẳng vào vòng tiếp theo. Các đội không nằm trong Top N sẽ bị loại và không thể nộp bài ở vòng sau."
  },
  {
    title: "6. Quy tắc ứng xử & Gian lận",
    content: "Nghiêm cấm mọi hành vi sao chép mã nguồn không ghi rõ nguồn, sử dụng các sản phẩm đã hoàn thiện trước cuộc thi mà không báo cáo, hoặc đạo nhái ý tưởng của đội khác. Các trường hợp vi phạm sẽ bị Coordinator hủy tư cách thi đấu (Disqualified). Mọi hành động hủy tư cách thi đấu sẽ được ghi vết rõ ràng kèm lý do chi tiết vào hệ thống Audit Log để bảo đảm tính minh bạch."
  }
];

export const aiService = {
  /**
   * Seed default rules. Bypasses text-embedding API key limitations.
   */
  async seedRules() {
    // Clear existing rules
    await prisma.ruleDocument.deleteMany({});

    const seededDocs = [];
    for (const rule of SAMPLE_RULES) {
      const doc = await prisma.ruleDocument.create({
        data: {
          title: rule.title,
          content: rule.content,
          embedding: [0.1, 0.2, 0.3], // Dummy values to satisfy database schema without failing
        },
      });
      seededDocs.push(doc);
    }
    return {
      message: 'Seeded default rules successfully (using keyword matching RAG).',
      count: seededDocs.length,
    };
  },

  /**
   * Answer queries about rules using local Keyword Search + Gemini 2.5 Flash.
   */
  async chatRules(question: string) {
    // 1. Fetch all stored rules
    const docs = await prisma.ruleDocument.findMany({});
    
    // Auto-seed if database is empty to prevent bad request on first run
    if (docs.length === 0) {
      console.log('Rules database empty, auto-seeding sample rules...');
      await this.seedRules();
    }

    const allDocs = docs.length > 0 ? docs : await prisma.ruleDocument.findMany({});

    // 2. Keyword matching algorithm (tokenizes query and computes matches)
    const cleanToken = (str: string) => 
      str.toLowerCase()
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
         .split(/\s+/)
         .filter(word => word.length > 1);

    const queryTokens = cleanToken(question);

    // Score documents
    const scoredDocs = allDocs.map((doc) => {
      const docText = `${doc.title} ${doc.content}`.toLowerCase();
      
      let matchCount = 0;
      if (queryTokens.length > 0) {
        queryTokens.forEach(token => {
          if (docText.includes(token)) {
            matchCount++;
          }
        });
      }

      // Calculate similarity (matched tokens / query tokens)
      const similarity = queryTokens.length > 0 ? (matchCount / queryTokens.length) : 0;

      return {
        title: doc.title,
        content: doc.content,
        similarity: similarity > 0 ? similarity : 0.05, // give small base similarity
      };
    });

    // Sort descending by similarity
    scoredDocs.sort((a, b) => b.similarity - a.similarity);

    // Take top 3 relevant sections
    const topDocs = scoredDocs.slice(0, 3);
    const contextText = topDocs
      .map((d) => `[Tiêu đề: ${d.title}] (Độ tương đồng: ${Math.round(d.similarity * 100)}%)\nNội dung: ${d.content}`)
      .join('\n\n');

    // 3. Send context + question to Gemini 2.5 Flash (supported by user's key)
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Bạn là Trợ lý Ảo hỗ trợ giải đáp quy chế cuộc thi Hackathon SEAL. Dưới đây là các tài liệu quy chế cuộc thi được cung cấp làm ngữ cảnh (context):

${contextText}

Hãy trả lời câu hỏi sau của người dùng một cách chính xác, ngắn gọn và lịch sự (bằng tiếng Việt). 
Quy tắc trả lời:
- Bạn chỉ được phép sử dụng thông tin trong phần ngữ cảnh được cung cấp ở trên.
- Không tự suy diễn hay thêm thắt thông tin nằm ngoài ngữ cảnh.
- Nếu câu hỏi của người dùng không liên quan đến quy chế hoặc thông tin không có trong ngữ cảnh, hãy lịch sự phản hồi rằng: "Xin lỗi, thông tin này không có trong quy chế hiện tại của SEAL Hackathon. Vui lòng liên hệ Coordinator để biết thêm chi tiết."

Câu hỏi của người dùng: "${question}"
Trả lời:`;

    const chatResult = await model.generateContent(prompt);
    const answer = chatResult.response.text();

    return {
      answer,
      context: topDocs.map((d) => ({ title: d.title, similarity: d.similarity })),
    };
  },

  /**
   * Analyze event scores, leaderboard, judge comments and predict seed teams.
   */
  async analyzeEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tracks: true,
        rounds: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    const roundsData = [];
    for (const round of event.rounds) {
      let leaderboard: any[] = [];
      try {
        leaderboard = await scoreService.getLeaderboard(round.id);
      } catch (err) {
        // Round might have no scores/submissions yet
      }

      const submissions = await prisma.submission.findMany({
        where: { roundId: round.id },
        include: {
          team: { select: { id: true, name: true, track: { select: { name: true } } } },
          scores: {
            include: {
              judge: { select: { fullName: true } },
              criterion: { select: { name: true, maxPoints: true, isTechnical: true } },
            },
          },
        },
      });

      const formattedSubmissions = submissions.map((sub) => ({
        teamName: sub.team.name,
        trackName: sub.team.track.name,
        isDisqualified: sub.isDisqualified,
        scores: sub.scores.map((s) => ({
          judgeName: s.judge.fullName,
          criterionName: s.criterion.name,
          scoreValue: s.scoreValue,
          maxPoints: s.criterion.maxPoints,
          isTechnical: s.criterion.isTechnical,
          comment: s.comments,
        })),
      }));

      roundsData.push({
        roundId: round.id,
        roundName: round.name,
        roundStatus: round.status,
        topNToProgress: round.topNToProgress,
        leaderboard: leaderboard.slice(0, 10).map((l) => ({
          rank: l.rank,
          teamName: l.team.name,
          trackName: l.team.trackName,
          averageScore: l.averageScore,
        })),
        submissionsDetail: formattedSubmissions,
      });
    }

    const structuredData = {
      eventName: event.name,
      description: event.description,
      year: event.year,
      term: event.term,
      status: event.status,
      rounds: roundsData,
    };

    // Prompt Gemini 2.5 Flash for statistical and descriptive analysis
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Bạn là một Trợ lý phân tích số liệu giải đấu Hackathon SEAL-HMS chuyên nghiệp. Dưới đây là thông tin về sự kiện, các vòng đấu, bảng điểm (leaderboard) và nhận xét chi tiết của giám khảo:

[DỮ LIỆU GIẢI ĐẤU]
${JSON.stringify(structuredData, null, 2)}

Hãy viết một báo cáo phân tích chuyên sâu chi tiết (bằng tiếng Việt, sử dụng định dạng Markdown hoàn chỉnh) phục vụ cho Ban tổ chức (Coordinator) và Hội đồng giám khảo. Báo cáo của bạn phải bao gồm các phần sau:

1. **Tổng quan giải đấu**: Tóm tắt số lượng vòng thi, tình trạng các vòng, và nhận định chung về quy mô sự kiện.
2. **Phân tích Đội thi & Xác định Đội hạt giống (Seed Teams)**:
   - Dựa trên bảng điểm và điểm số trung bình, chỉ rõ các đội thi nổi bật của mỗi Track (ví dụ Web Application, Mobile Application).
   - Phân tích điểm kỹ thuật (technical depth) vs kỹ năng trình bày.
   - Dự đoán Top các đội hạt giống có khả năng vô địch cao kèm lập luận thuyết phục từ số liệu điểm số và nhận xét của giám khảo.
3. **Phân tích phong độ & Biến động**: Nhận xét sự bứt phá hoặc sụt giảm điểm số giữa các vòng (nếu có nhiều vòng thi).
4. **Phân tích Hội đồng giám khảo (Judge Bias & Alignment)**:
   - Dựa trên các comment nhận xét và điểm số của giám khảo chấm cùng bài thi, đánh giá xem các giám khảo có chấm đồng thuận hay không.
   - Chỉ ra nếu có giám khảo nào có xu hướng chấm quá khắt khe hoặc quá lỏng tay, hoặc có sự mâu thuẫn lớn trong nhận xét của các giám khảo chấm cùng một bài thi (ví dụ: một người khen code tốt, một người chê tệ).
5. **Khuyến nghị chiến lược cho Ban tổ chức**: Đề xuất các hành động cụ thể để nâng cao chất lượng chấm thi, hỗ trợ các đội có tiềm năng nhưng đang gặp khó khăn, và đảm bảo tính công bằng.

Vui lòng trình bày báo cáo bằng Markdown rõ ràng, chuyên nghiệp, cấu trúc mạch lạc và số liệu dẫn chứng cụ thể từ dữ liệu được cung cấp.

Báo cáo phân tích giải đấu:`;

    const result = await model.generateContent(prompt);
    const report = result.response.text();

    return {
      report,
      analyzedAt: new Date(),
    };
  },
};
