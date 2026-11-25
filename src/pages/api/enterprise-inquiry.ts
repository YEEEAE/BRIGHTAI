import type { APIRoute } from 'astro';
import { inquiryAvailability, submitInquiry } from '../../server/contact/enterprise-inquiry.mjs';

export const prerender = false;
export const GET: APIRoute = inquiryAvailability;
export const HEAD: APIRoute = inquiryAvailability;
export const POST: APIRoute = ({ request }) => submitInquiry(request);
