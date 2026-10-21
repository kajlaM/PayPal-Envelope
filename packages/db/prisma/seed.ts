import { prisma } from '../src/client.ts';

// Demo data: the sandbox user and the merchant registry.
// Real store names map to our sandbox merchant accounts, because real stores cannot receive sandbox money.

const userEmail = process.env.USER_SANDBOX_EMAIL;
const audioEmail = process.env.AUDIO_STORE_SANDBOX_EMAIL;
const utilityEmail = process.env.CITY_UTILITY_SANDBOX_EMAIL;

if (!userEmail || !audioEmail || !utilityEmail) {
  throw new Error('Set USER_SANDBOX_EMAIL, AUDIO_STORE_SANDBOX_EMAIL and CITY_UTILITY_SANDBOX_EMAIL in .env');
}

const merchants = [
  { name: 'Audio Store', category: 'Electronics', sandboxEmail: audioEmail },
  { name: 'BestBuy', category: 'Electronics', sandboxEmail: audioEmail },
  { name: 'Target', category: 'Electronics', sandboxEmail: audioEmail },
  { name: 'City Utility', category: 'Utilities', sandboxEmail: utilityEmail },
];

await prisma.user.upsert({
  where: { paypalEmail: userEmail },
  update: {},
  create: { name: 'Demo User', paypalEmail: userEmail },
});

for (const m of merchants) {
  await prisma.merchant.upsert({ where: { name: m.name }, update: m, create: m });
}

console.log(`Seeded 1 user and ${merchants.length} merchants.`);
await prisma.$disconnect();
