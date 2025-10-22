import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email-service';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VerificationEmail from '@/emails/VerificationEmail';

export async function POST(request: Request) {
  const body = await request.json();
  const { to, template, props } = body;
  if (!to || !template) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  // For now support only verification template; extendable later
  let html = '';
  if (template === 'verification') {
    // render the React component to HTML using react-dom/server
    // props should be an object of props for the component
    const element = React.createElement(VerificationEmail as any, props || {});
    html = '<!DOCTYPE html>' + renderToStaticMarkup(element);
  } else {
    return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
  }

  await sendEmail({ to, subject: props.subject || 'AfriConnect', text: props.text || '', html });

  return NextResponse.json({ success: true });
}
