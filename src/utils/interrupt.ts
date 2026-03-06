let activeAbortController: AbortController | null = null;

function interruptedError(): Error {
  return new Error("Interrupted");
}

export function beginInterruptibleOperation(): AbortController {
  const controller = new AbortController();
  activeAbortController = controller;
  return controller;
}

export function clearInterruptibleOperation(controller: AbortController): void {
  if (activeAbortController === controller) {
    activeAbortController = null;
  }
}

export function handleInterruptSignal(): void {
  process.stderr.write("\nInterrupted\n");

  if (activeAbortController && !activeAbortController.signal.aborted) {
    activeAbortController.abort(interruptedError());
    return;
  }

  process.exit(130);
}

export function isInterruptedError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  return err.name === "AbortError" || err.message === "Interrupted";
}
