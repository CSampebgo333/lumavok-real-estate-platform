import { localizedMetadata } from "@/lib/localizedMetadata";
import { UiText } from "@/components/common/UiText";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata({
    title: `Access denied | ${APP_NAME}`,
  });
}

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        title="Access denied"
        description="Your account doesn't have permission to view this page."
        action={
          <Link href={ROUTES.HOME} className={buttonVariants()}>
            <UiText text={"Back to home"} />{" "}
          </Link>
        }
      />
    </div>
  );
}
