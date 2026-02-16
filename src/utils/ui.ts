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

export function verbose(message: string, isVerbose?: boolean): void {
  if (isVerbose) {
    console.error(chalk.dim(`  ${message}`));
  }
}
