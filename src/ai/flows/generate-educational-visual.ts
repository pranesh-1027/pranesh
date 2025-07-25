'use server';

/**
 * @fileOverview A flow for generating educational visuals based on user input and selected domain.
 *
 * - generateEducationalVisual - A function that handles the image generation process.
 * - GenerateEducationalVisualInput - The input type for the generateEducationalVisual function.
 * - GenerateEducationalVisualOutput - The return type for the generateEducationalVisual function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEducationalVisualInputSchema = z.object({
  prompt: z.string().describe('The concept to visualize (e.g., mitosis).'),
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
export type GenerateEducationalVisualInput = z.infer<typeof GenerateEducationalVisualInputSchema>;

const GenerateEducationalVisualOutputSchema = z.object({
  image: z.string().describe('The generated image as a data URI.'),
});
export type GenerateEducationalVisualOutput = z.infer<typeof GenerateEducationalVisualOutputSchema>;

export async function generateEducationalVisual(input: GenerateEducationalVisualInput): Promise<GenerateEducationalVisualOutput> {
  return generateEducationalVisualFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEducationalVisualPrompt',
  input: {schema: GenerateEducationalVisualInputSchema},
  output: {schema: GenerateEducationalVisualOutputSchema},
  prompt: `You are an Educational and Scientific Image Generator Bot.
Your purpose is to generate accurate, labeled, and helpful visuals strictly related to education.
You ONLY support the following domains:

- Biology (e.g., anatomy, cells, organs, systems)
- Physics (e.g., forces, optics, motion, electricity)
- Chemistry (e.g., atoms, lab apparatus, molecular structures)
- Geography & Environment (e.g., ecosystems, water cycle, climate diagrams)
- Space Science (e.g., solar system, black holes, phases of moon)
- Engineering (e.g., circuits, machines, gear systems)
- Computer Science (e.g., logic gates, flowcharts, AI diagrams)
- Mathematics (e.g., graphs, geometry shapes, algebra visualizations)

If a user asks for anything unrelated to education (e.g., memes, fantasy, cartoons, gaming, celebrities, animals, fictional characters, or NSFW content), respond strictly with:

❌ "I don't do that. I only create educational and scientific visuals."

Stay consistent and never break these rules.

Generate an educational image of the following concept in the specified domain:

Domain: {{{domain}}}
Concept: {{{prompt}}}

If the request is outside of supported domains, respond with the error message above.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateEducationalVisualFlow = ai.defineFlow(
  {
    name: 'generateEducationalVisualFlow',
    inputSchema: GenerateEducationalVisualInputSchema,
    outputSchema: GenerateEducationalVisualOutputSchema,
  },
  async input => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt(input).prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media || !media.url) {
        return {image: '❌ "I don\'t do that. I only create educational and scientific visuals." '};
      }

      return {image: media.url};
    } catch (e: any) {
      console.error('Error generating image:', e);
      return {image: '❌ "I don\'t do that. I only create educational and scientific visuals." '};
    }
  }
);
