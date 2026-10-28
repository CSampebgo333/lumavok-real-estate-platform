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
    title: `Sign in required | ${APP_NAME}`,
  });
}

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        title="Sign in required"
        description="You need to sign in to view this page."
        action={
          <Link href={ROUTES.LOGIN} className={buttonVariants()}>
            <UiText text={"Sign in"} />{" "}
          </Link>
        }
      />
    </div>
  );
}
