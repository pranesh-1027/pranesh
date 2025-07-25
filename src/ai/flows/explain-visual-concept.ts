'use server';

/**
 * @fileOverview A flow for explaining an educational visual.
 *
 * - explainVisualConcept - A function that handles the explanation process.
 * - ExplainVisualConceptInput - The input type for the explainVisualConcept function.
 * - ExplainVisualConceptOutput - The return type for the explainVisualConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainVisualConceptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a visual, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  domain: z.enum([
    'Biology',
    'Physics',
    'Chemistry',
    'Geography & Environment',
    'Space Science',
    'Engineering',
    'Computer Science',
    'Mathematics',
  ]).describe('The educational or scientific domain.'),
});
export type ExplainVisualConceptInput = z.infer<typeof ExplainVisualConceptInputSchema>;

const ExplainVisualConceptOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the visual concept.'),
});
export type ExplainVisualConceptOutput = z.infer<typeof ExplainVisualConceptOutputSchema>;

export async function explainVisualConcept(input: ExplainVisualConceptInput): Promise<ExplainVisualConceptOutput> {
  return explainVisualConceptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainVisualConceptPrompt',
  input: {schema: ExplainVisualConceptInputSchema},
  output: {schema: ExplainVisualConceptOutputSchema},
  prompt: `You are an expert educator across multiple scientific domains. Your task is to explain the concept shown in the provided image.

The user has specified the domain: {{{domain}}}

Analyze the following image and provide a clear, concise, and easy-to-understand explanation of the concept it illustrates.

Image: {{media url=photoDataUri}}`,
});

const explainVisualConceptFlow = ai.defineFlow(
  {
    name: 'explainVisualConceptFlow',
    inputSchema: ExplainVisualConceptInputSchema,
    outputSchema: ExplainVisualConceptOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (e: any) {
      console.error('Error generating explanation:', e);
      return {explanation: '❌ Sorry, I was unable to explain that image.'};
    }
  }
);
