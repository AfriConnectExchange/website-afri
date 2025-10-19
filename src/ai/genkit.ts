'use server';
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {genkitEval, GenkitMetric} from '@genkit-ai/evaluator';
import {dotprompt} from '@genkit-ai/dotprompt';

configureGenkit({
  plugins: [
    firebase(),
    googleAI(),
    genkitEval({
      judge: 'googleai/gemini-pro',
      metrics: [GenkitMetric.Faithfulness, GenkitMetric.AnswerRelevancy],
      embedder: 'googleai/text-embedding-004',
    }),
    dotprompt(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = genkit;
