'use server';
/**
 * @fileOverview An intelligent moderator AI agent.
 *
 * - analyzeContent - A function that handles the content analysis process.
 * - AnalyzeContentInput - The input type for the analyzeContent function.
 * - AnalyzeContentOutput - The return type for the analyzeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeContentInputSchema = z.object({
  chatContent: z.string().describe('The content of the chat message to analyze.'),
});
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;

const AnalyzeContentOutputSchema = z.object({
  policyViolationDetected: z.boolean().describe('Whether or not a policy violation was detected.'),
  explanation: z.string().describe('The explanation of the policy violation, if any.'),
  suggestedAction: z.string().describe('The suggested action to take, if any.'),
});
export type AnalyzeContentOutput = z.infer<typeof AnalyzeContentOutputSchema>;

export async function analyzeContent(input: AnalyzeContentInput): Promise<AnalyzeContentOutput> {
  return analyzeContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeContentPrompt',
  input: {schema: AnalyzeContentInputSchema},
  output: {schema: AnalyzeContentOutputSchema},
  prompt: `You are an AI-powered moderator specializing in identifying policy violations in group chat content.

You will analyze the chat content provided and determine if any policy violations have occurred. If a violation is detected, you will provide an explanation and suggest an action to take.

Chat Content: {{{chatContent}}}`,
});

const analyzeContentFlow = ai.defineFlow(
  {
    name: 'analyzeContentFlow',
    inputSchema: AnalyzeContentInputSchema,
    outputSchema: AnalyzeContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
