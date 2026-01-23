import { env } from "../config/env";
import { maskEmail } from "./privacy";

export const sendMagicLink = async (params: {
  email: string;
  token: string;
}): Promise<void> => {
  const maskedEmail = maskEmail(params.email);

  if (env.nodeEnv !== "production") {
    console.info(
      `Dev magic link token for ${maskedEmail}: ${params.token}`
    );
    return;
  }

  console.warn(
    `TODO: implement magic link email delivery for ${maskedEmail}.`
  );
};
