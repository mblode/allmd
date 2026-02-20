import chalk from "chalk";
import ora, { type Ora } from "ora";

export function createSpinner(text: string): Ora {
  return ora({ text, color: "cyan" });
}

export function success(message: string): void {
  console.log(`${chalk.green("✓")} ${message}`);
}

export function error(message: string): void {
  console.error(`${chalk.red("✗")} ${message}`);
}

export function info(message: string): void {
  console.log(`${chalk.blue("ℹ")} ${message}`);
}

export function warn(message: string): void {
  console.log(`${chalk.yellow("⚠")} ${message}`);
}

export function hint(message: string): void {
  console.error(chalk.dim(`  ${message}`));
}

export function verbose(message: string, isVerbose?: boolean): void {
  if (isVerbose) {
    console.error(chalk.dim(`  ${message}`));
  }
}

export function formatError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  // API key errors
  if (
    message.includes("API key") ||
    message.includes("401") ||
    message.includes("Incorrect API key")
  ) {
    return `${message}\n  Set OPENAI_API_KEY in .env or your environment. See: https://platform.openai.com/api-keys`;
  }

  // Rate limit
  if (message.includes("429") || message.includes("rate limit")) {
    return `${message}\n  You've hit the API rate limit. Wait a moment and try again.`;
  }

  // File size limit
  if (
    message.includes("413") ||
    message.includes("Maximum content size limit")
  ) {
    return `${message}\n  Audio exceeds OpenAI's 25MB upload limit. This is unexpected — compression should have handled it. Please report this as a bug.`;
  }

  // Network errors
  if (message.includes("ENOTFOUND") || message.includes("ECONNREFUSED")) {
    return `${message}\n  Check your internet connection and try again.`;
  }

  // ffmpeg missing
  if (
    message.includes("ffmpeg") &&
    (message.includes("ENOENT") || message.includes("not found"))
  ) {
    return `${message}\n  Video/audio conversion requires ffmpeg. Install it: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)`;
  }

  return message;
}
