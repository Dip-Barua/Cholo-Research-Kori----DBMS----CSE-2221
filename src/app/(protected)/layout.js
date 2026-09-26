import ProtectedLayout from "@/components/layout/ProtectedLayout"

export default function Layout({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}
