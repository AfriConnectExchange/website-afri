'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
// import { testDbConnection } from '@/ai/flows/test-db-connection';

export default function TestDbPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      // const response = await testDbConnection();
      const response: any = { error: "Test function is currently disabled." };
      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.message || 'Success!');
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Click the button below to attempt to create a new test user directly in the `public.users` table using an admin client. Check your Supabase live logs for detailed query information.
          </p>
          <Button onClick={handleTest} disabled={isLoading || true} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              'Run DB Connection Test (Disabled)'
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md flex items-start gap-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Test Successful</h3>
                <pre className="text-xs text-green-700 whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-md flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Test Failed</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
