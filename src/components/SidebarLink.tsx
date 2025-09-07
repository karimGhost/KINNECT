"use client"

import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarLinkProps {
  href: string
  children: React.ReactNode
}

export default function SidebarLink({ href, children }: SidebarLinkProps) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const pathname = usePathname();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && isMobile) {
      setOpenMobile(false) // ✅ closes mobile sidebar (Sheet)
    } else {
      // setOpen(false) // optional: collapse sidebar on desktop if you want
    }
  }

  return (
 

       <Link   onClick={handleClick}

                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent hover:text-accent-foreground",
                  pathname === href 
                    ? " text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
      {children}
    </Link>
  )
}
