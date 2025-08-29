'use server';

/**
 * @fileOverview This file implements the Lost Family Finder flow, which suggests similar family names or origins to help users connect with potential relatives.
 *
 * @exports `lostFamilyFinder` - An async function that takes user's family name and origin, and suggests similar family names or origins.
 * @exports `LostFamilyFinderInput` - The input type for the `lostFamilyFinder` function.
 * @exports `LostFamilyFinderOutput` - The output type for the `lostFamilyFinder` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LostFamilyFinderInputSchema = z.object({
  familyName: z.string().describe('The family name to search for similar families.'),
  origin: z.string().describe('The origin of the family (e.g., country or region).'),
});

export type LostFamilyFinderInput = z.infer<typeof LostFamilyFinderInputSchema>;

const LostFamilyFinderOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of suggested similar family names or origins.'),
});

export type LostFamilyFinderOutput = z.infer<typeof LostFamilyFinderOutputSchema>;

export async function lostFamilyFinder(input: LostFamilyFinderInput): Promise<LostFamilyFinderOutput> {
  return lostFamilyFinderFlow(input);
}

const lostFamilyFinderPrompt = ai.definePrompt({
  name: 'lostFamilyFinderPrompt',
  input: {schema: LostFamilyFinderInputSchema},
  output: {schema: LostFamilyFinderOutputSchema},
  prompt: `You are a genealogy expert helping users find potential relatives by suggesting similar family names or origins.

  Given the following information, suggest similar family names or origins that the user might want to explore:

  Family Name: {{{familyName}}}
  Origin: {{{origin}}}

  Please provide a list of suggestions. Focus on plausible, real family names and origins.
  `,
});

const lostFamilyFinderFlow = ai.defineFlow(
  {
    name: 'lostFamilyFinderFlow',
    inputSchema: LostFamilyFinderInputSchema,
    outputSchema: LostFamilyFinderOutputSchema,
  },
  async input => {
    const {output} = await lostFamilyFinderPrompt(input);
    return output!;
  }
);
