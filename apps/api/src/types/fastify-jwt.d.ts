import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      deviceId?: string | null;
    };
    user: {
      sub: string;
      deviceId?: string | null;
    };
  }
}
