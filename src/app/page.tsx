'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Atom, BrainCircuit, Cog, Dna, FlaskConical, Globe, Loader2, Rocket, Sigma, TerminalSquare, BookOpen, Lightbulb,
} from 'lucide-react';

import { generateEducationalVisual, GenerateEducationalVisualInput } from '@/ai/flows/generate-educational-visual';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


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
  prompt: z.string().min(3, {
    message: 'Prompt must be at least 3 characters.',
  }),
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
});

type HistoryItem = GenerateEducationalVisualInput & { image: string };

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      domain: 'Biology',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedContent(null);
    try {
      const result = await generateEducationalVisual(values);
      setGeneratedContent(result.image);

      if (result.image && !result.image.startsWith('❌')) {
        setHistory(prev => [{ ...values, image: result.image }, ...prev.slice(0, 49)]);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'An error occurred',
        description: 'Failed to generate visual. Please try again.',
        variant: 'destructive',
      });
      setGeneratedContent('❌ An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleHistoryClick = (item: HistoryItem) => {
    form.setValue('prompt', item.prompt);
    form.setValue('domain', item.domain);
    setGeneratedContent(item.image);
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
                <p className="mt-2 text-sm">No visuals generated yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left rounded-lg overflow-hidden border hover:border-primary transition-all group"
                  >
                    <div className="overflow-hidden">
                       <Image
                        src={item.image}
                        alt={item.prompt}
                        width={250}
                        height={150}
                        className="object-cover w-full h-24 group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="educational visual"
                      />
                    </div>
                    <div className="p-2 bg-card">
                      <p className="text-sm font-medium truncate group-hover:text-primary">{item.prompt}</p>
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
          {/* A drawer for history could be added here for mobile */}
        </header>

        <div className="flex-1 grid lg:grid-cols-2 gap-8 p-4 md:p-8 overflow-y-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create Educational Visual</CardTitle>
              <CardDescription>Enter a concept and select a domain to generate an image.</CardDescription>
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
                            rows={5}
                            {...field}
                          />
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
                        Generating...
                      </>
                    ) : (
                      'Generate Visual'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Generated Visual</CardTitle>
              <CardDescription>The AI-generated visual will appear below.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full aspect-video rounded-lg border border-dashed flex items-center justify-center bg-muted/50 p-2">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                      <Lightbulb className="h-16 w-16 animate-pulse text-accent" />
                      <p>Generating your visual...</p>
                  </div>
                ) : generatedContent ? (
                  isError ? (
                    <div className="text-center text-destructive p-4">
                      <p className="font-semibold">{generatedContent}</p>
                    </div>
                  ) : (
                    <Image
                      src={generatedContent}
                      alt={form.getValues('prompt')}
                      width={512}
                      height={512}
                      className="object-contain w-full h-full rounded-md"
                      data-ai-hint="educational visual"
                    />
                  )
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <p>Your generated visual will be displayed here.</p>
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
