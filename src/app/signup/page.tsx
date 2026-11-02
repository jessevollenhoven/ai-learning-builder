// Renders the teacher account registration page.
import Link from "next/link";
import { AuthLayout } from "../../components/auth/auth-layout";
import { SignupForm } from "../../components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Set up your teacher workspace with an email and password."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-[#285c43] hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}