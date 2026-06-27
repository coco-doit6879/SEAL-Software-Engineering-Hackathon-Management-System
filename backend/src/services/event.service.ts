import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { CreateEventInput, UpdateEventInput } from '../validators/event.validator';

export const eventService = {
  async createEvent(data: CreateEventInput) {
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        term: data.term,
        year: data.year,
        status: data.status,
      },
    });
    return event;
  },

  async getEvents() {
    const events = await prisma.event.findMany({
      include: {
        tracks: true,
        rounds: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return events;
  },

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            mentors: { include: { user: { select: { id: true, fullName: true, email: true } } } },
            teams: true,
          },
        },
        rounds: {
          orderBy: { sequenceNumber: 'asc' },
          include: {
            criteria: true,
            judges: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          },
        },
      },
    });

    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    return event;
  },

  async updateEvent(id: string, data: UpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    const updated = await prisma.event.update({
      where: { id },
      data,
    });
    return updated;
  },

  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw ApiError.notFound('Event not found.');
    }

    await prisma.event.delete({ where: { id } });
    return { message: 'Event deleted successfully.' };
  },
};
