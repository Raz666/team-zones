import { FastifyReply } from "fastify";

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string
): FastifyReply => {
  return reply.status(statusCode).send({
    error: {
      code,
      message,
    },
  });
};
