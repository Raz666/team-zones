export const maskEmail = (email: string): string => {
  const [user, domain] = email.split("@");
  if (!user || !domain) {
    return "***";
  }

  const visible = user.slice(0, 1);
  return `${visible}***@${domain}`;
};
