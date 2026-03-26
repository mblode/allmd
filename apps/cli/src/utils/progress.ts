import { Listr } from "listr2";

export interface ProgressStep<T> {
  task: (ctx: T) => Promise<void>;
  title: string;
}

export function createProgressTasks<T>(
  steps: ProgressStep<T>[],
  initialCtx: T
): Listr<T> {
  return new Listr<T>(
    steps.map((step) => ({
      title: step.title,
      task: async (ctx) => {
        await step.task(ctx);
      },
    })),
    {
      concurrent: false,
      exitOnError: true,
      rendererOptions: { collapseErrors: false },
      renderer: "default" as const,
      silentRendererCondition: !process.stdout.isTTY,
      ctx: initialCtx,
    }
  );
}
