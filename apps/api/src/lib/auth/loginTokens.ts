import { isExpired } from "./tokens";

type LoginTokenRecord = {
  expiresAt: Date;
  usedAt: Date | null;
};

export const isLoginTokenUsable = (
  token: LoginTokenRecord,
  now: Date = new Date()
): boolean => {
  if (token.usedAt) {
    return false;
  }

  return !isExpired(token.expiresAt, now);
};
