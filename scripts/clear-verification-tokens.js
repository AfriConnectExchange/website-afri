/*
  Safe script to export existing verification tokens and then delete them.
  Run with: node scripts/clear-verification-tokens.js
  Requires DATABASE_URL env to be set.
*/
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  try {
    const tokens = await prisma.verificationToken.findMany();
    const outDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `verification_tokens_backup_${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(tokens, null, 2));
    console.log(`Exported ${tokens.length} tokens to ${outPath}`);

    const deleted = await prisma.verificationToken.deleteMany();
    console.log(`Deleted ${deleted.count} verification tokens from database.`);
  } catch (err) {
    console.error('Error clearing tokens:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
