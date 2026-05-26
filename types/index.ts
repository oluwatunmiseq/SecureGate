import { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
    } & DefaultSession['user'];
  }

  interface User {
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    emailVerified?: Date | null;
  }
}
