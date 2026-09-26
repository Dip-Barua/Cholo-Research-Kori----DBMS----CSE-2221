"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm({ resolver: zodResolver(schema) })

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--bg-main)] px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image src="/logo/transparent_logo_zoomed.png" alt="Cholo Research Kori" width={240} height={72} className="h-14 w-auto object-contain" priority />
          </div>

          <div className="mb-6 space-y-2 text-center">
            <div className="text-sm font-medium text-[color:var(--primary-dark)]">Welcome back</div>
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text-primary)]">Sign in</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">Use your university account to continue your research workflow.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-[color:var(--bg-main)] px-3 py-2 transition-colors focus-within:border-[color:var(--primary-dark)] focus-within:bg-white">
                <Mail className="h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="email" type="email" autoComplete="email" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" {...register("email")} />
              </div>
              {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border-color)] bg-[color:var(--bg-main)] px-3 py-2 transition-colors focus-within:border-[color:var(--primary-dark)] focus-within:bg-white">
                <Lock className="h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" {...register("password")} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="rounded-md p-1 text-[color:var(--text-secondary)] transition-colors hover:bg-white hover:text-[color:var(--primary-dark)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
        </div>
      </div>
    </main>
  )
}
