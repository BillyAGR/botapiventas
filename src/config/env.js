import dotenv from 'dotenv';

dotenv.config();

export default {
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  API_VERSION: process.env.API_VERSION,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  BASEURL: process.env.BASEURL,
  PORT: process.env.PORT || 3000,
};