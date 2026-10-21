// npm run run -w packages/agents -- <vaultId> ["task"]
// Needs the API running (npm run api:dev).
import { runVaultAgent } from '../src/index.ts';

const [vaultId, task] = process.argv.slice(2);
if (!vaultId) {
  console.error('Usage: npm run run -w packages/agents -- <vaultId> ["task"]');
  process.exit(1);
}

const result = await runVaultAgent({
  vaultId,
  task,
  onStep: (s) => console.log(`> ${s.tool}`, JSON.stringify(s.input), '\n  =', JSON.stringify(s.output)),
});
console.log(`\n[${result.agent} agent, ${result.model}]\n${result.summary}`);
