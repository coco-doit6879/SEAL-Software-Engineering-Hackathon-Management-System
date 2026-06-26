import { z } from 'zod';

export const chatRulesSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export const analyzeEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});

export type ChatRulesInput = z.infer<typeof chatRulesSchema>;
export type AnalyzeEventInput = z.infer<typeof analyzeEventSchema>;
