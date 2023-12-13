import { EventSchemas, Inngest } from 'inngest';
import { rateLimitMiddleware } from './middlewares/rate-limit-middleware';

export const inngest = new Inngest({ id: 'notion-app' });
