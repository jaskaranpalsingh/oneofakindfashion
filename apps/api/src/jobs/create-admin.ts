import { connectDatabase, disconnectDatabase } from "../config/db";
import { env } from "../config/env";
import { createInitialAdmin } from "../services/auth.service";
import { logger } from "../utils/logger";

async function createAdmin() {
  const email = env.ADMIN_INITIAL_EMAIL;
  const password = env.ADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    logger.error(
      "Set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD before creating an admin"
    );
    process.exit(1);
  }

  await connectDatabase();
  const admin = await createInitialAdmin(email, password);
  logger.info("Admin account ready", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    adminRole: admin.adminRole,
  });
  await disconnectDatabase();
}

createAdmin().catch(async (error) => {
  logger.error("create-admin failed", { error });
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
