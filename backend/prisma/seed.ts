import { PrismaClient, Role, UserStatus, EventStatus, RoundStatus, TeamStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in correct order to avoid foreign key / reference issues
  await prisma.teamInvitation.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.calibrationScore.deleteMany({});
  await prisma.calibrationSample.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.roundJudge.deleteMany({});
  await prisma.roundCriterion.deleteMany({});
  await prisma.round.deleteMany({});
  await prisma.trackMentor.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database...');

  // 1. Hash passwords for seed accounts
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Coordinator
  const coordinator = await prisma.user.create({
    data: {
      email: 'coordinator@fpt.edu.vn',
      fullName: 'Coordinator SE Dept',
      passwordHash,
      role: Role.COORDINATOR,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Coordinator created: ${coordinator.email}`);

  // 3. Create Internal Judge
  const internalJudge = await prisma.user.create({
    data: {
      email: 'faculty.judge@fpt.edu.vn',
      fullName: 'Dr. Nguyen Van A (Faculty)',
      passwordHash,
      role: Role.INTERNAL_JUDGE,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Internal Judge created: ${internalJudge.email}`);

  // 4. Create Guest Judge
  const guestJudge = await prisma.user.create({
    data: {
      email: 'guest.judge@partner.com',
      fullName: 'Mr. John Doe (Industry Guest)',
      passwordHash,
      role: Role.GUEST_JUDGE,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Guest Judge created: ${guestJudge.email}`);

  // 5. Create Mentor
  const mentor = await prisma.user.create({
    data: {
      email: 'mentor1@fpt.edu.vn',
      fullName: 'ThS. Tran Thi B (Mentor)',
      passwordHash,
      role: Role.MENTOR,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Mentor created: ${mentor.email}`);

  // 6. Create Student 1 (Leader of Alpha Team)
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@fpt.edu.vn',
      fullName: 'Le Van Cuong (Student)',
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
      studentProfile: {
        create: {
          isFptStudent: true,
          studentCode: 'SE160001',
          university: 'FPT University HCMC',
        },
      },
    },
  });
  console.log(`Student 1 created: ${student1.email}`);

  // Create Student 2 (Leader of Beta Team)
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@fpt.edu.vn',
      fullName: 'Nguyen Van B (Student)',
      passwordHash,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
      studentProfile: {
        create: {
          isFptStudent: true,
          studentCode: 'SE160002',
          university: 'FPT University HCMC',
        },
      },
    },
  });
  console.log(`Student 2 created: ${student2.email}`);

  // 7. Create Event (SEAL Spring 2026)
  const event = await prisma.event.create({
    data: {
      name: 'SEAL Spring Hackathon 2026',
      description: 'Software Engineering Agile League - Spring Edition 2026',
      term: 'Spring',
      year: 2026,
      status: EventStatus.ACTIVE,
      tracks: {
        createMany: {
          data: [
            { name: 'Web Application', description: 'Web application track focusing on performance and scalability' },
            { name: 'Mobile Application', description: 'Mobile application track focusing on UI/UX and utility' },
          ],
        },
      },
    },
    include: {
      tracks: true,
    },
  });
  console.log(`Event created: ${event.name}`);

  const webTrack = event.tracks.find(t => t.name === 'Web Application')!;
  const mobileTrack = event.tracks.find(t => t.name === 'Mobile Application')!;

  // 8. Create Vòng loại (Prelim Round)
  const deadlinePrelim = new Date();
  deadlinePrelim.setDate(deadlinePrelim.getDate() + 15);

  const roundPrelim = await prisma.round.create({
    data: {
      eventId: event.id,
      name: 'Vòng loại (Prelim)',
      sequenceNumber: 1,
      submissionDeadline: deadlinePrelim,
      status: RoundStatus.SUBMISSION_OPEN,
      topNToProgress: 3,
      criteria: {
        createMany: {
          data: [
            { name: 'UI/UX Design', description: 'Giao diện và trải nghiệm người dùng', maxPoints: 10, weight: 0.20, isTechnical: false },
            { name: 'Technical Depth', description: 'Kiến trúc phần mềm và chất lượng mã nguồn', maxPoints: 10, weight: 0.50, isTechnical: true },
            { name: 'Presentation & Pitching', description: 'Kỹ năng thuyết trình và phản biện', maxPoints: 10, weight: 0.30, isTechnical: false },
          ],
        },
      },
    },
  });
  console.log(`Prelim Round created: ${roundPrelim.name}`);

  // 9. Create Vòng chung kết (Final Round)
  const deadlineFinal = new Date();
  deadlineFinal.setDate(deadlineFinal.getDate() + 30);

  const roundFinal = await prisma.round.create({
    data: {
      eventId: event.id,
      name: 'Vòng chung kết (Final)',
      sequenceNumber: 2,
      submissionDeadline: deadlineFinal,
      status: RoundStatus.UPCOMING,
      topNToProgress: 1,
      criteria: {
        createMany: {
          data: [
            { name: 'UI/UX Design', description: 'Hoàn thiện giao diện sản phẩm', maxPoints: 10, weight: 0.20, isTechnical: false },
            { name: 'Technical depth & Security', description: 'Tính bảo mật, hiệu năng và chất lượng code tối ưu', maxPoints: 10, weight: 0.50, isTechnical: true },
            { name: 'Business Pitching', description: 'Tính khả thi kinh doanh và thuyết trình', maxPoints: 10, weight: 0.30, isTechnical: false },
          ],
        },
      },
    },
  });
  console.log(`Final Round created: ${roundFinal.name}`);

  // 10. Assign Judges to both rounds (VERY IMPORTANT so judges can see them)
  await prisma.roundJudge.createMany({
    data: [
      { roundId: roundPrelim.id, userId: internalJudge.id },
      { roundId: roundPrelim.id, userId: guestJudge.id },
      { roundId: roundFinal.id, userId: internalJudge.id },
      { roundId: roundFinal.id, userId: guestJudge.id },
    ]
  });
  console.log('Judges assigned to Prelim and Final rounds.');

  // 11. Create seeded Teams and assign members (Omitted to allow live creation/invitation demo)
  console.log('Skipping team seeding to allow live team creation demo.');

  // 12. Create Calibration Sample for Prelim Round
  const sample = await prisma.calibrationSample.create({
    data: {
      roundId: roundPrelim.id,
      title: 'Dự án mẫu chấm thử (Web Agility)',
      description: 'Mã nguồn mẫu của ứng dụng Web có một số lỗi UI nhẹ và tối ưu DB chưa tốt để Giám khảo thống nhất thang điểm.',
      repoUrl: 'https://github.com/seal-hms/calibration-web-sample',
      demoUrl: 'https://calibration-web-sample.vercel.app',
      documentUrl: 'https://drive.google.com/file/d/calibration-web-doc/view',
    }
  });
  console.log(`Calibration sample created for Prelim Round.`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
