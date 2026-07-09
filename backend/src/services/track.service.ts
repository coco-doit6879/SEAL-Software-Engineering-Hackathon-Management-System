import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { CreateTrackInput, UpdateTrackInput } from '../validators/track.validator';

export const trackService = {
  async createTrack(data: CreateTrackInput) {
    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    const track = await prisma.track.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        description: data.description,
      },
    });
    return track;
  },

  async getTracksByEvent(eventId: string) {
    const tracks = await prisma.track.findMany({
      where: { eventId },
      include: {
        mentors: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
        teams: true,
      },
    });
    return tracks;
  },

  async updateTrack(id: string, data: UpdateTrackInput) {
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      throw ApiError.notFound('Track not found.');
    }

    const updated = await prisma.track.update({
      where: { id },
      data,
    });
    return updated;
  },

  async deleteTrack(id: string) {
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      throw ApiError.notFound('Track not found.');
    }

    await prisma.track.delete({ where: { id } });
    return { message: 'Track deleted successfully.' };
  },

  async assignMentor(trackId: string, userId: string) {
    // Verify track exists
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      throw ApiError.notFound('Track not found.');
    }

    // Verify user is a mentor
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    if (user.role !== 'MENTOR') {
      throw ApiError.badRequest('User is not a mentor.');
    }

    // Check if already assigned
    const existing = await prisma.trackMentor.findUnique({
      where: { trackId_userId: { trackId, userId } },
    });
    if (existing) {
      throw ApiError.conflict('Mentor is already assigned to this track.');
    }

    const assignment = await prisma.trackMentor.create({
      data: { trackId, userId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    return assignment;
  },

  async removeMentor(trackId: string, userId: string) {
    const assignment = await prisma.trackMentor.findUnique({
      where: { trackId_userId: { trackId, userId } },
    });
    if (!assignment) {
      throw ApiError.notFound('Mentor assignment not found.');
    }

    await prisma.trackMentor.delete({
      where: { trackId_userId: { trackId, userId } },
    });
    return { message: 'Mentor removed from track.' };
  },

  async getMyMentoredTracks(userId: string) {
    const trackMentors = await prisma.trackMentor.findMany({
      where: { userId },
      include: {
        track: {
          include: {
            event: true,
            teams: {
              include: {
                members: {
                  include: {
                    user: { select: { id: true, fullName: true, email: true } },
                  },
                },
                submissions: {
                  include: {
                    round: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return trackMentors.map((tm) => tm.track);
  },
};
