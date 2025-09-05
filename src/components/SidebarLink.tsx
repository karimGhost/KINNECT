"use client"

import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"

interface SidebarLinkProps {
  href: string
  children: React.ReactNode
}

export default function SidebarLink({ href, children }: SidebarLinkProps) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar()

  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && isMobile) {
      setOpenMobile(false) // ✅ closes mobile sidebar (Sheet)
    } else {
      setOpen(false) // optional: collapse sidebar on desktop if you want
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="flex items-center gap-2 text-sm"
    >
      {children}
    </Link>
  )
}
