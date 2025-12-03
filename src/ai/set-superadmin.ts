
import { genkit } from 'genkit';
import { onFlow } from '@genkit-ai/flow';
import { firebase } from '@genkit-ai/firebase';
import * as admin from 'firebase-admin';
import { z } from 'zod';

genkit.config({
  plugins: [firebase()],
});

export const setSuperAdmin = onFlow(
  {
    name: 'setSuperAdmin',
    inputSchema: z.string(),
    outputSchema: z.void(),
  },
  async (uid) => {
    await admin.auth().setCustomUserClaims(uid, { superadmin: true });
  }
);
