'use server';
/**
 * @fileOverview A flow for testing database connections.
 */

import { ai } from '@/ai/genkit';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { z } from 'zod';
import { generateRandomString } from '@/lib/utils';


export const testDbConnection = ai.defineFlow(
  {
    name: 'testDbConnection',
    inputSchema: z.void(),
    outputSchema: z.object({
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  async () => {
    try {
      const supabase = await createServerAdminClient();
      const randomEmail = `testuser_${generateRandomString()}@example.com`;
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: randomEmail,
          full_name: 'Test User',
          roles: ['buyer'],
          status: 'active',
          email_verified: true,
          // This is a placeholder since we are bypassing the auth.users trigger
          auth_user_id: '00000000-0000-0000-0000-000000000000',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: `Successfully created test user with ID: ${data.id}`,
      };
    } catch (e: any) {
      return {
        error: e.message,
      };
    }
  }
);
