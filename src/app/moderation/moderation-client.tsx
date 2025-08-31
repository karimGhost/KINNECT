'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestModerationActions, type SuggestModerationActionsOutput } from '@/ai/flows/intelligent-moderator-suggest-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Shield, ThumbsUp, Loader2, Info } from 'lucide-react';

const formSchema = z.object({
  chatContent: z.string().min(10, 'Chat content must be at least 10 characters.'),
  policyGuidelines: z.string().min(20, 'Policy guidelines must be at least 20 characters.'),
});

const defaultPolicy = `- No hate speech or discrimination.
- No harassment or bullying.
- No sharing of illegal content.
- No spam or phishing.
- Respect others' privacy.`;

export default function ModerationClient() {
  const [result, setResult] = useState<SuggestModerationActionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chatContent: '',
      policyGuidelines: defaultPolicy,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const moderationResult = await suggestModerationActions(values);
      setResult(moderationResult);
    } catch (e) {
      setError('An error occurred while analyzing the content. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Analyze Chat Content</CardTitle>
          <CardDescription>Enter a chat message and the group policy to check for violations and get moderation suggestions.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="chatContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'This is a test message to analyze.'" {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyGuidelines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Guidelines</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                Analyze Content
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            <CardTitle className="text-destructive">Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.policyViolationIdentified ? (
                <AlertCircle className="text-destructive" />
              ) : (
                <CheckCircle className="text-green-600" />
              )}
              Analysis Result
            </CardTitle>
            <CardDescription>
              {result.policyViolationIdentified ? 'A policy violation was identified.' : 'No policy violations found.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground"/> Explanation</h3>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{result.explanation}</p>
            </div>
            {result.policyViolationIdentified && result.suggestedActions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-muted-foreground" /> Suggested Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedActions.map((action, index) => (
                    <Badge key={index} variant="secondary">{action}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
