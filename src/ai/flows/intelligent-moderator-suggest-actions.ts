'use server';
/**
 * @fileOverview An AI agent that suggests moderation actions for identified policy violations in a group chat.
 *
 * - suggestModerationActions - A function that suggests moderation actions based on chat content.
 * - SuggestModerationActionsInput - The input type for the suggestModerationActions function.
 * - SuggestModerationActionsOutput - The return type for the suggestModerationActions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestModerationActionsInputSchema = z.object({
  chatContent: z
    .string()
    .describe('The content of the chat message to be evaluated.'),
  policyGuidelines: z
    .string()
    .describe('The policy guidelines for the group chat.'),
});
export type SuggestModerationActionsInput = z.infer<typeof SuggestModerationActionsInputSchema>;

const SuggestModerationActionsOutputSchema = z.object({
  policyViolationIdentified: z
    .boolean()
    .describe('Whether or not the chat content violates the policy.'),
  suggestedActions: z
    .array(z.string())
    .describe('Suggested moderation actions for the identified violation.'),
  explanation: z
    .string()
    .describe('Explanation of why the chat content violates the policy.'),
});
export type SuggestModerationActionsOutput = z.infer<typeof SuggestModerationActionsOutputSchema>;

export async function suggestModerationActions(
  input: SuggestModerationActionsInput
): Promise<SuggestModerationActionsOutput> {
  return suggestModerationActionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestModerationActionsPrompt',
  input: {schema: SuggestModerationActionsInputSchema},
  output: {schema: SuggestModerationActionsOutputSchema},
  prompt: `You are an AI-powered moderator for a group chat.

You will receive chat content and the group chat's policy guidelines.

Your task is to analyze the chat content and determine if it violates the policy guidelines.

If a violation is identified, provide a list of suggested moderation actions that the group chat admin can take.  Explain why the chat content violates the policy.

Chat Content: {{{chatContent}}}
Policy Guidelines: {{{policyGuidelines}}}

Considerations for identifying violations:
- Hate speech and discrimination
- Harassment and bullying
- Illegal activities
- Spam and phishing
- Graphic violence or threats
- Sharing of personal information without consent

If the content does not violate the policy, set policyViolationIdentified to false and suggestedActions to an empty list.

Output a JSON object conforming to the SuggestModerationActionsOutputSchema. The Zod schema descriptions are repeated here for clarity:

{
  policyViolationIdentified: boolean, // Whether or not the chat content violates the policy.
  suggestedActions: string[], // Suggested moderation actions for the identified violation. Examples: ["Warn user", "Delete message", "Suspend user"].
  explanation: string, // Explanation of why the chat content violates the policy.
}
`,
});

const suggestModerationActionsFlow = ai.defineFlow(
  {
    name: 'suggestModerationActionsFlow',
    inputSchema: SuggestModerationActionsInputSchema,
    outputSchema: SuggestModerationActionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
