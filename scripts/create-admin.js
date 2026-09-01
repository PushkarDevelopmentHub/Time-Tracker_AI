// One-time script: creates your single admin login.
// Run with: node scripts/create-admin.js you@email.com yourPassword123
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.js <email> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, isAdmin: true },
  });

  console.log("Admin user ready:", user.email);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
