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

const textGenerationPrompt = ai.definePrompt({
  name: 'generateEducationalVisualTextPrompt',
  input: {schema: GenerateEducationalVisualInputSchema},
  prompt: `You are an expert in creating image generation prompts for educational and scientific visuals.
Your task is to take a user's concept and domain and convert it into a clear, descriptive prompt for an image generation model.
The prompt should describe a diagram, illustration, or visual representation that is accurate, labeled, and helpful for learning.

Focus on generating a descriptive prompt for the visual, not a conversational response.

The user wants an image for:
Domain: {{{domain}}}
Concept: {{{prompt}}}

Generate a detailed image prompt based on this. For example, if the user asks for "photosynthesis", a good prompt would be:
"A detailed diagram of photosynthesis, showing a plant cell with chloroplasts. Illustrate the inputs (sunlight, water, carbon dioxide) and outputs (glucose, oxygen). Use clear labels for all components."
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
      const llmResponse = await textGenerationPrompt(input);
      const imagePrompt = llmResponse.text;

      if (imagePrompt.includes("I don't do that.")) {
        return { image: `❌ ${imagePrompt}` };
      }

      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: imagePrompt,
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
