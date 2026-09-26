"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/components/providers/AppProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().min(2, "University is required"),
  department: z.string().min(2, "Department is required"),
})

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    try {
      await registerUser({ ...values, role: "researcher" })
      router.push("/dashboard")
    } catch (error) {
      setError("root", { message: error.message })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--bg-main)] px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-[2rem] border border-[color:var(--border-color)] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image src="/logo/transparent_logo_zoomed.png" alt="Cholo Research Kori" width={240} height={72} className="h-14 w-auto object-contain" priority />
          </div>

          <div className="mb-6 space-y-2 text-center">
            <div className="text-sm font-medium text-[color:var(--primary-dark)]">Create account</div>
            <h1 className="text-3xl font-semibold tracking-tight">Join Us</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">Create your profile to start collaborating on research projects.</p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="h-11 rounded-xl border-[color:var(--border-color)] bg-[color:var(--bg-main)]" {...register("name")} />
              {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="h-11 rounded-xl border-[color:var(--border-color)] bg-[color:var(--bg-main)]" {...register("email")} />
              {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="h-11 rounded-xl border-[color:var(--border-color)] bg-[color:var(--bg-main)]" {...register("password")} />
              {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" className="h-11 rounded-xl border-[color:var(--border-color)] bg-[color:var(--bg-main)]" {...register("department")} />
              {errors.department ? <p className="text-sm text-red-600">{errors.department.message}</p> : null}
            </div>            
            <div className="space-y-full md:col-span-2">
              <Label htmlFor="university">University</Label>
              <Input id="university" className="h-11 rounded-xl border-[color:var(--border-color)] bg-[color:var(--bg-main)]" {...register("university")} />
              {errors.university ? <p className="text-sm text-red-600">{errors.university.message}</p> : null}
            </div>

            {errors.root ? <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.root.message}</div> : null}

            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
              <p className="text-sm text-[color:var(--text-secondary)]">Already have an account? <Link href="/login" className="font-medium text-[color:var(--primary-dark)]">Login</Link></p>
              <Button type="submit" className="justify-center gap-2 rounded-xl bg-[color:var(--primary-dark)] text-white hover:bg-[color:color-mix(in_srgb,var(--primary-dark)_88%,black)]" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create account"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
