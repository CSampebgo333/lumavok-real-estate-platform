import { localizedMetadata } from "@/lib/localizedMetadata";
import { UiText } from "@/components/common/UiText";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata({
    title: `Create an account | ${APP_NAME}`,
    description: `Create a free ${APP_NAME} account.`,
  });
}

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Browse and save properties in Burkina Faso"
      footer={
        <>
          <UiText text={"Already have an account?"} />{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-white underline underline-offset-2 hover:text-white/80"
          >
            <UiText text={"Sign in"} />{" "}
          </Link>
        </>
      }
    >
      <RegisterForm
        termsUrl={process.env.TERMS_URL}
        privacyUrl={process.env.PRIVACY_URL}
      />
    </AuthCard>
  );
}
