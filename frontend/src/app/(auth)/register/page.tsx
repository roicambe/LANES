import { RegisterForm } from "@/features/auth/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Join LANES</h1>
          <p className="text-slate-500 text-sm">Help your community by reporting floods in real-time.</p>
        </div>

        <RegisterForm />

        <div className="text-center pt-2">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/profile" className="text-blue-600 font-medium hover:text-blue-500 hover:underline transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
