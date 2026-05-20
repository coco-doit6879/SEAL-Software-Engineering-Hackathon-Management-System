import { PrismaClient, Role, UserStatus, EventStatus, RoundStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Hash passwords for seed accounts
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Coordinator
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@fpt.edu.vn' },
    update: {},
    create: {
      email: 'coordinator@fpt.edu.vn',
      fullName: 'Coordinator SE Dept',
      passwordHash,
      role: Role.COORDINATOR,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Coordinator created: ${coordinator.email}`);

  // 3. Create Internal Judge
  const internalJudge = await prisma.user.upsert({
    where: { email: 'faculty.judge@fpt.edu.vn' },
    update: {},
    create: {
      email: 'faculty.judge@fpt.edu.vn',
      fullName: 'Dr. Nguyen Van A (Faculty)',
      passwordHash,
      role: Role.INTERNAL_JUDGE,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Internal Judge created: ${internalJudge.email}`);

  // 4. Create Guest Judge
  const guestJudge = await prisma.user.upsert({
    where: { email: 'guest.judge@partner.com' },
    update: {},
    create: {
      email: 'guest.judge@partner.com',
      fullName: 'Mr. John Doe (Industry Guest)',
      passwordHash,
      role: Role.GUEST_JUDGE,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Guest Judge created: ${guestJudge.email}`);

  // 5. Create Mentor
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor1@fpt.edu.vn' },
    update: {},
    create: {
      email: 'mentor1@fpt.edu.vn',
      fullName: 'ThS. Tran Thi B (Mentor)',
      passwordHash,
      role: Role.MENTOR,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`Mentor created: ${mentor.email}`);

  // 6. Create Student
  const student = await prisma.user.upsert({
    where: { email: 'student1@fpt.edu.vn' },
    update: {},
    create: {
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
  console.log(`Student created: ${student.email}`);

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

  // 8. Create Vòng loại (Prelim Round)
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30); // 30 days from now

  const round = await prisma.round.create({
    data: {
      eventId: event.id,
      name: 'Vòng loại (Prelim)',
      sequenceNumber: 1,
      submissionDeadline: deadline,
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
  console.log(`Prelim Round created: ${round.name}`);

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
