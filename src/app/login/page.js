"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Mail, Lock } from "lucide-react"
import { useAuth } from "@/components/providers/AppProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "admin@cholo.local", password: "admin123" } })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get("email")
    const password = params.get("password")
    if (email) setValue("email", email)
    if (password) setValue("password", password)
  }, [setValue])

  const onSubmit = async (values) => {
    try {
      await login(values)
      router.push("/dashboard")
    } catch (error) {
      setError("root", { message: error.message })
    }
  }

  const demoAccounts = [["admin@cholo.local", "admin123"]]

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--bg-main)] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
          <div className="mb-6 space-y-3">
            <div className="text-sm font-medium text-[color:var(--primary-dark)]">Welcome back</div>
            <h1 className="text-3xl font-semibold tracking-tight">Login to Cholo Research Kori</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">Use your university account to continue your research workflow.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-white px-3 focus-within:border-[color:var(--primary-dark)]">
                <Mail className="h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="email" type="email" className="border-0 px-0 shadow-none focus-visible:ring-0" {...register("email")} />
              </div>
              {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-white px-3 focus-within:border-[color:var(--primary-dark)]">
                <Lock className="h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="password" type="password" className="border-0 px-0 shadow-none focus-visible:ring-0" {...register("password")} />
              </div>
              {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            {errors.root ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div> : null}

            <Button type="submit" className="w-full justify-center gap-2 rounded-xl bg-[color:var(--primary-dark)] text-white hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[color:var(--text-secondary)]">
            Don&apos;t have an account? <Link href="/register" className="font-medium text-[color:var(--primary-dark)]">Register</Link>
          </div>
        </section>

        <aside className="space-y-4 rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">Demo Accounts</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Use one of these seeded accounts to try the full MVP.</p>
          </div>
          <div className="space-y-3">
            {demoAccounts.map(([email, password]) => (
              <button key={email} type="button" onClick={() => {
                setValue("email", email)
                setValue("password", password)
              }} className="w-full rounded-2xl border border-[color:var(--border-color)] p-4 text-left transition-colors hover:bg-[color:rgba(31,176,200,0.08)]">
                <div className="font-medium">{email}</div>
                <div className="text-sm text-[color:var(--text-secondary)]">Password: {password}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
