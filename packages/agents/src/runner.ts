import { generateText, stepCountIs, type ToolSet } from 'ai';
import { policyModels } from '@paypalvault/policy';

export type AgentStep = { tool: string; input: unknown; output: unknown };

export type AgentRun = {
  summary: string;
  model: string;
  steps: AgentStep[];
};

/**
 * Runs one agent loop. Tries each configured model in order (Claude, then Gemini),
 * but only switches models if nothing was spent yet, so a retry never pays twice.
 */
export async function runAgent(input: {
  system: string;
  prompt: string;
  tools: ToolSet;
  hasSpent: () => boolean;
  onStep?: (step: AgentStep) => void;
  maxSteps?: number;
}): Promise<AgentRun> {
  let lastError: unknown;
  for (const model of policyModels()) {
    const steps: AgentStep[] = [];
    try {
      const result = await generateText({
        model,
        system: input.system,
        prompt: input.prompt,
        tools: input.tools,
        stopWhen: stepCountIs(input.maxSteps ?? 12),
        onStepFinish: ({ toolCalls, toolResults }) => {
          for (const call of toolCalls) {
            const res = toolResults.find((r) => r.toolCallId === call.toolCallId);
            const step = { tool: call.toolName, input: call.input, output: res?.output };
            steps.push(step);
            input.onStep?.(step);
          }
        },
      });
      return { summary: result.text, model: model.modelId, steps };
    } catch (err) {
      if (input.hasSpent()) throw err;
      lastError = err;
      console.warn(`Agent model ${model.modelId} failed, trying the next one:`, (err as Error).message);
    }
  }
  throw lastError;
}
