try {
  require("dotenv").config();
} catch (e) {
  // dotenv might be missing in some environments, Prisma usually loads .env anyway
}

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
