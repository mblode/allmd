const API_KEY_REQUIREMENTS = {
  firecrawl: {
    envVar: "FIRECRAWL_API_KEY",
    help: "Set it in your environment or .env file before using web conversion.",
  },
  openai: {
    envVar: "OPENAI_API_KEY",
    help: "Set it in your environment or .env file before running this conversion.",
  },
} as const;

export type RequiredApiKeys = Partial<
  Record<keyof typeof API_KEY_REQUIREMENTS, boolean>
>;

export function getRequiredApiKey(
  provider: keyof typeof API_KEY_REQUIREMENTS
): string {
  const { envVar, help } = API_KEY_REQUIREMENTS[provider];
  const value = process.env[envVar]?.trim();

  if (!value) {
    throw new Error(`${envVar} is required. ${help}`);
  }

  return value;
}

export function assertRequiredApiKeys(required: RequiredApiKeys): void {
  for (const [provider, isRequired] of Object.entries(required)) {
    if (!isRequired) {
      continue;
    }

    getRequiredApiKey(provider as keyof typeof API_KEY_REQUIREMENTS);
  }
}
