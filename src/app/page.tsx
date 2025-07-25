'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Atom, BrainCircuit, Cog, Dna, FlaskConical, Globe, Loader2, Rocket, Sigma, TerminalSquare, BookOpen, Lightbulb, Image as ImageIcon, X,
} from 'lucide-react';

import { generateEducationalVisual, GenerateEducationalVisualInput } from '@/ai/flows/generate-educational-visual';
import { explainVisualConcept, ExplainVisualConceptInput } from '@/ai/flows/explain-visual-concept';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';


const domains = [
  { value: 'Biology', label: 'Biology', icon: Dna },
  { value: 'Physics', label: 'Physics', icon: Atom },
  { value: 'Chemistry', label: 'Chemistry', icon: FlaskConical },
  { value: 'Geography & Environment', label: 'Geography & Environment', icon: Globe },
  { value: 'Space Science', label: 'Space Science', icon: Rocket },
  { value: 'Engineering', label: 'Engineering', icon: Cog },
  { value: 'Computer Science', label: 'Computer Science', icon: TerminalSquare },
  { value: 'Mathematics', label: 'Mathematics', icon: Sigma },
];

const formSchema = z.object({
  prompt: z.string().optional(),
  domain: z.enum([
    'Biology',
    'Physics',
    'Chemistry',
    'Geography & Environment',
    'Space Science',
    'Engineering',
    'Computer Science',
    'Mathematics',
  ]),
  image: z.any().optional(),
}).refine(data => !!data.prompt || !!data.image, {
  message: 'Please provide a prompt or an image.',
  path: ['prompt'],
});

type FormValues = z.infer<typeof formSchema>;

type HistoryItem = (GenerateEducationalVisualInput & { image: string, type: 'visual' }) | (ExplainVisualConceptInput & { explanation: string, type: 'explanation' });

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'visual' | 'explanation' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      domain: 'Biology',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue('image', reader.result as string);
        form.clearErrors('prompt');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setGeneratedContent(null);
    setContentType(null);

    try {
      if (values.image) {
        // Explanation mode
        setContentType('explanation');
        const result = await explainVisualConcept({ photoDataUri: values.image, domain: values.domain });
        setGeneratedContent(result.explanation);
        if (result.explanation && !result.explanation.startsWith('❌')) {
          setHistory(prev => [{ photoDataUri: values.image as string, domain: values.domain, explanation: result.explanation, type: 'explanation' }, ...prev.slice(0, 49)]);
        }
      } else {
        // Generation mode
        setContentType('visual');
        if (!values.prompt) {
            toast({ title: 'Prompt is required', description: 'Please enter a prompt to generate a visual.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        const result = await generateEducationalVisual({prompt: values.prompt, domain: values.domain});
        setGeneratedContent(result.image);

        if (result.image && !result.image.startsWith('❌')) {
          setHistory(prev => [{ prompt: values.prompt!, domain: values.domain, image: result.image, type: 'visual' }, ...prev.slice(0, 49)]);
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'An error occurred',
        description: 'Failed to process request. Please try again.',
        variant: 'destructive',
      });
      setGeneratedContent('❌ An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleHistoryClick = (item: HistoryItem) => {
    if (item.type === 'visual') {
      form.setValue('prompt', item.prompt);
      form.setValue('domain', item.domain);
      removeImage();
      setGeneratedContent(item.image);
      setContentType('visual');
    } else {
      form.setValue('prompt', '');
      form.setValue('domain', item.domain);
      setImagePreview(item.photoDataUri);
      form.setValue('image', item.photoDataUri);
      setGeneratedContent(item.explanation);
      setContentType('explanation');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isError = generatedContent?.startsWith('❌');

  return (
    <div className="flex min-h-screen w-full bg-background font-body">
      <aside className="w-[280px] border-r bg-card p-4 flex-col hidden md:flex">
        <div className="flex items-center gap-2 mb-6">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">EduVis AI</h1>
        </div>
        <Separator />
        <div className="flex-1 mt-4">
          <h2 className="text-lg font-semibold mb-2">History</h2>
          <ScrollArea className="h-[calc(100vh-150px)] pr-3">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <BookOpen className="mx-auto h-12 w-12" />
                <p className="mt-2 text-sm">No items generated yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left rounded-lg overflow-hidden border hover:border-primary transition-all group"
                  >
                    <div className="overflow-hidden aspect-video bg-muted flex items-center justify-center">
                       <Image
                        src={item.type === 'visual' ? item.image : item.photoDataUri}
                        alt={item.type === 'visual' ? item.prompt : 'Uploaded image'}
                        width={250}
                        height={150}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="educational visual"
                      />
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-sm font-medium truncate group-hover:text-primary">{item.type === 'visual' ? item.prompt : 'Explanation'}</p>
                      <p className="text-xs text-muted-foreground">{item.domain}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center justify-between md:hidden sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">EduVis AI</h1>
          </div>
        </header>

        <div className="flex-1 grid lg:grid-cols-2 gap-8 p-4 md:p-8 overflow-y-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create or Explain a Visual</CardTitle>
              <CardDescription>Enter a concept to generate a visual, or upload an image to have it explained.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concept / Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., The process of photosynthesis"
                            className="resize-none"
                            rows={3}
                            {...field}
                            disabled={!!imagePreview}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="text-center text-sm text-muted-foreground">OR</div>

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload Image</FormLabel>
                        <FormControl>
                          <>
                          {imagePreview ? (
                            <div className="relative">
                              <Image src={imagePreview} alt="Image preview" width={200} height={200} className="rounded-md mx-auto" />
                              <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={removeImage}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" ref={fileInputRef} />
                              </label>
                            </div>
                          )}
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a domain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {domains.map((domain) => (
                              <SelectItem key={domain.value} value={domain.value}>
                                <div className="flex items-center gap-2">
                                  <domain.icon className="h-4 w-4" />
                                  <span>{domain.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {imagePreview ? 'Explaining...' : 'Generating...'}
                      </>
                    ) : (
                      imagePreview ? 'Explain Visual' : 'Generate Visual'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Result</CardTitle>
              <CardDescription>The AI-generated content will appear below.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full rounded-lg border border-dashed flex items-center justify-center bg-muted/50 p-2">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <Lightbulb className="h-16 w-16 animate-pulse text-accent" />
                      <p>Processing...</p>
                  </div>
                ) : generatedContent ? (
                  isError ? (
                    <div className="text-center text-destructive p-4">
                      <p className="font-semibold">{generatedContent}</p>
                    </div>
                  ) : contentType === 'visual' ? (
                    <Image
                      src={generatedContent}
                      alt={form.getValues('prompt') || 'Generated visual'}
                      width={512}
                      height={512}
                      className="object-contain w-full h-full rounded-md"
                      data-ai-hint="educational visual"
                    />
                  ) : (
                     <ScrollArea className="h-full w-full p-4">
                       <p className="whitespace-pre-wrap">{generatedContent}</p>
                     </ScrollArea>
                  )
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <p>Your generated visual or explanation will be displayed here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
