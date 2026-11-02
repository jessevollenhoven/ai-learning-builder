// Renders the email/password sign-in page.
import Link from "next/link";
import { AuthLayout } from "../../components/auth/auth-layout";
import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue building learning activities."
      footer={
        <>
          New to Lesson Foundry?{" "}
          <Link className="font-semibold text-[#285c43] hover:underline" href="/signup">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}