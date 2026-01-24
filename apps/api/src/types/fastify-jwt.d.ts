import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      deviceId?: string | null;
      entitlements?: string[];
      nonce?: string;
      iat?: number;
      exp?: number;
      [key: string]: unknown;
    };
    user: {
      sub: string;
      deviceId?: string | null;
    };
  }
}
