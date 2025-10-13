// pages/login.tsx
import dynamic from "next/dynamic";
import Head from "next/head";

const AuthForm = dynamic(() => import("../components/AuthForm"), { ssr: false });

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
        <AuthForm />
      </main>
    </>
  );
}
