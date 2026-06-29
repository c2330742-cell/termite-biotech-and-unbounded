// Prisma 7+ config — provides the datasource URL
// This replaces the `url` property in schema.prisma

import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://chronosend:chronosend@localhost:5432/chronosend',
  },
});
