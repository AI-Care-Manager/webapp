"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../components/ui/button"
import { useAuthenticator } from "@aws-amplify/ui-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "../components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useTheme } from "next-themes"
import { useIsMobile } from "../hooks/use-mobile"
import { LogIn, LogOut, Menu, User, Moon, Sun, ChevronRight } from 'lucide-react'
import { signOut } from 'aws-amplify/auth';

const Navbar = () => {
  const { user } = useAuthenticator((context) => [context.user])
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure theme component only renders after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleLogin = () => {
    router.push("/signin")
    setIsOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Animation variants for consistent animations
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  const mobileMenuVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const mobileItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    hover: {
      x: 5,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  }

  const NavLinks = () => (
    <motion.div className="flex items-center gap-6 mx-4" variants={itemVariants} initial="hidden" animate="visible">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <Link
          href="/"
          className={`hover:text-orange-500 text-sm font-medium hover:underline underline-offset-4 transition-colors ${pathname === '/' ? 'text-orange-500' : ''}`}
        >
          Home
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <Link
          href="/pricing"
          className={`hover:text-orange-500 text-sm font-medium hover:underline underline-offset-4 transition-colors ${pathname === '/pricing' ? 'text-orange-500' : ''}`}
        >
          Pricing
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <Link
          href="/dashboard"
          className={`hover:text-orange-500 text-sm font-medium hover:underline underline-offset-4 transition-colors ${pathname === '/dashboard' ? 'text-orange-500' : ''}`}
        >
          Dashboard
        </Link>
      </motion.div>
    </motion.div>
  )

  const MobileMenu = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2 }}>
          <Button variant="outline" size="icon" aria-label="Open menu" className="rounded-xl">
            {user ? <User className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="right" className="w-[240px] sm:w-[300px]">
        <VisuallyHidden asChild>
          <h2>Navigation Menu</h2>
        </VisuallyHidden>
        <motion.nav
          className="flex flex-col gap-5 mt-8"
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
        >
          {user && (
            <motion.div
              className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-md"
              variants={mobileItemVariants}
            >
              <User className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-sm">{user.username}</span>
            </motion.div>
          )}

          {/* Navigation Links */}
          <SheetClose asChild>
            <motion.div variants={mobileItemVariants} whileHover="hover" whileTap="tap">
              <Link href="/" className="block p-2 hover:text-orange-500 transition-colors">
                Home
              </Link>
            </motion.div>
          </SheetClose>

          <SheetClose asChild>
            <motion.div variants={mobileItemVariants} whileHover="hover" whileTap="tap">
              <Link href="/pricing" className="block p-2 hover:text-orange-500 transition-colors">
                Pricing
              </Link>
            </motion.div>
          </SheetClose>

          <SheetClose asChild>
            <motion.div variants={mobileItemVariants} whileHover="hover" whileTap="tap">
              <Link href="/dashboard" className="block p-2 hover:text-orange-500 transition-colors">
                Dashboard
              </Link>
            </motion.div>
          </SheetClose>

          <SheetClose asChild>
            <motion.div variants={mobileItemVariants} whileHover="hover" whileTap="tap">
              <Link href="/contact" className="block p-2 hover:text-orange-500 transition-colors">
                Contact
              </Link>
            </motion.div>
          </SheetClose>

          {/* Theme Toggle */}
          <motion.div variants={mobileItemVariants} whileHover="hover" whileTap="tap">
            <Button
              variant="ghost"
              className="w-full justify-start p-2"
              onClick={toggleTheme}
            >
              {mounted && theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </Button>
          </motion.div>

          {/* Auth Button */}
          <motion.div variants={mobileItemVariants} className="mt-4">
            {user ? (
              <Button onClick={handleSignOut} className="w-full rounded-xl" variant="default">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button onClick={handleLogin} className="w-full rounded-xl" variant="default">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </motion.div>
        </motion.nav>
      </SheetContent>
    </Sheet>
  )

  const ThemeToggle = () => {
    if (!mounted) return null;

    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-xl"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </motion.div>
    );
  };

  const AuthButton = () => {
    if (user) {
      return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
          <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </Button>
        </motion.div>
      )
    }

    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <Button variant="outline" onClick={() => router.push("/signin")} className="rounded-xl">
          <LogIn className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline text-sm">Login</span>
        </Button>
      </motion.div>
    )
  }

  const DemoButton = () => (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
      <Button
        className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl"
        asChild
      >
        <Link href="/#book-demo">
          Book a Demo
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </motion.div>
  )

  return (
    <motion.header
      className="fixed top-4 left-0 right-0 mx-4 md:mx-10 flex justify-between items-center bg-background/80 backdrop-blur-sm z-20 mt-2 py-3 px-4 rounded-2xl border border-border/40"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="font-bold text-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Link href="/">AI Care Manager</Link>
      </motion.div>

      <motion.div className="flex items-center gap-4 text-sm font-medium" variants={itemVariants}>
        <AnimatePresence mode="wait">
          {isMobile ? (
            <MobileMenu key="mobile" />
          ) : (
            <>
              <NavLinks key="desktop" />
              <ThemeToggle />
              {!user && <DemoButton />}
              <AuthButton />
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  )
}

export default Navbar
