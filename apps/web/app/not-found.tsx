import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-1 items-center justify-center px-4 text-center">
      <div>
        <p className="mb-2 font-mono text-muted-foreground text-sm">404</p>
        <h1 className="mb-2 font-semibold text-xl">Page not found</h1>
        <p className="mb-6 text-muted-foreground text-sm">
          That page does not exist. It may have been moved or removed.
        </p>
        <Link className={buttonVariants()} href="/">
          Back home
        </Link>
      </div>
    </div>
  );
}
