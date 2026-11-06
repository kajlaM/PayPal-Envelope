// Try the Policy Compiler from the terminal:
//   npm run compile -w @paypalvault/policy -- "Create a vault with $50 to buy headphones before Sunday, max spend $45"
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { compilePolicy } from '../src/index.ts';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

// Same merchants as packages/db/prisma/seed.ts
const merchants = [
  { name: 'Audio Store', category: 'Electronics' },
  { name: 'BestBuy', category: 'Electronics' },
  { name: 'Target', category: 'Electronics' },
  { name: 'City Utility', category: 'Utilities' },
];

const text = process.argv.slice(2).join(' ');
if (!text) throw new Error('Pass the request text as an argument');

const result = await compilePolicy(text, merchants);
console.log(JSON.stringify(result, null, 2));
