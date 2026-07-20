"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Menu, X, ShoppingBag, Plus, Home, Search, User, Mail, Lock, UserPlus, LogOut, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const navLinks = [
  { href: "/errands", label: "Browse Errands", icon: Search },
  { href: "/create", label: "Post Errand", icon: Plus },
  { href: "/dashboard", label: "Dashboard", icon: Home },
];

type SignupStep = "details" | "verify";

export function Navbar() {
  const router = useRouter();
  const { user, isLoading, signup, login, sendVerification, verifyEmail, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", estate: "" });
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Email verification state
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setAuthMode(ce.detail?.mode || "signup");
      setShowAuth(true);
      setSignupStep("details");
      setVerificationCode("");
      setCodeSent(false);
      setDevCode("");
    };
    window.addEventListener("open-auth", handler);
    return () => window.removeEventListener("open-auth", handler);
  }, []);

  // Cooldown timer for resend
  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setTimeout(() => setCodeCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!authForm.email) {
      setAuthError("Please enter your email first");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);

    const result = await sendVerification(authForm.email, "signup");
    if (result.success) {
      setCodeSent(true);
      setCodeCooldown(60);
      if (result.code) setDevCode(result.code);
      setSignupStep("verify");
      toast.success("Verification code sent!");
    } else {
      setAuthError(result.error || "Failed to send code");
    }
    setIsAuthLoading(false);
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (signupStep === "details") {
      if (!authForm.name || !authForm.email || !authForm.password) {
        setAuthError("Please fill in all fields");
        return;
      }
      // Send verification code
      await handleSendCode();
      setSignupStep("verify");
      return;
    }

    if (signupStep === "verify") {
      if (!verificationCode || verificationCode.length !== 6) {
        setAuthError("Please enter the 6-digit code");
        return;
      }

      setIsAuthLoading(true);

      // Verify the code
      const verifyResult = await verifyEmail(authForm.email, verificationCode, "signup");
      if (!verifyResult.success) {
        setAuthError(verifyResult.error || "Invalid verification code");
        setIsAuthLoading(false);
        return;
      }

      // Create the account
      const result = await signup(authForm.name, authForm.email, authForm.password, authForm.estate);
      if (result.success) {
        toast.success(`Welcome to MarketRun, ${authForm.name}!`);
        setShowAuth(false);
        setAuthForm({ name: "", email: "", password: "", estate: "" });
        setSignupStep("details");
        setVerificationCode("");
        setCodeSent(false);
        setDevCode("");
        router.push("/create");
      } else {
        setAuthError(result.error || "Signup failed");
      }
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authForm.email || !authForm.password) {
      setAuthError("Please fill in all fields");
      return;
    }

    setIsAuthLoading(true);
    const result = await login(authForm.email, authForm.password);
    if (result.success) {
      toast.success("Welcome back!");
      setShowAuth(false);
      setAuthForm({ name: "", email: "", password: "", estate: "" });
      router.push("/dashboard");
    } else {
      setAuthError(result.error || "Login failed");
    }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const resetAuth = () => {
    setSignupStep("details");
    setVerificationCode("");
    setCodeSent(false);
    setDevCode("");
    setAuthError("");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">MarketRun</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {!isLoading && (
                user ? (
                  <>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors">
                      <span className="text-sm font-medium">{user.name.split(" ")[0]}</span>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setAuthMode("login"); setShowAuth(true); resetAuth(); }}>
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => { setAuthMode("signup"); setShowAuth(true); resetAuth(); }}>
                      Get Started
                    </Button>
                  </>
                )
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50"
            >
              <div className="px-4 py-3 space-y-1">
                {user && navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 space-y-2">
                  {!isLoading && (
                    user ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg"
                        >
                          <span className="text-sm font-medium">{user.name}</span>
                        </Link>
                        <Button variant="outline" className="w-full" onClick={() => { handleLogout(); setIsOpen(false); }}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="w-full" onClick={() => { setAuthMode("login"); setShowAuth(true); resetAuth(); setIsOpen(false); }}>
                          <User className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                        <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => { setAuthMode("signup"); setShowAuth(true); resetAuth(); setIsOpen(false); }}>
                          Get Started
                        </Button>
                      </>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => { setShowAuth(false); resetAuth(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl p-8 w-full max-w-md border border-border/50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {authMode === "signup" && signupStep === "verify" ? (
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  ) : (
                    <ShoppingBag className="w-7 h-7 text-primary" />
                  )}
                </div>
                <h2 className="text-2xl font-bold">
                  {authMode === "login"
                    ? "Welcome Back"
                    : signupStep === "verify"
                    ? "Verify Your Email"
                    : "Join MarketRun"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {authMode === "login"
                    ? "Sign in to access your errands"
                    : signupStep === "verify"
                    ? `We sent a 6-digit code to ${authForm.email}`
                    : "Create an account to start shopping"}
                </p>
              </div>

              {authMode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="auth-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={authForm.email}
                        onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="auth-password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="auth-password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        value={authForm.password}
                        onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                      />
                    </div>
                  </div>

                  {authError && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{authError}</p>
                  )}

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isAuthLoading}>
                    {isAuthLoading && (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    )}
                    Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={authMode === "signup" && signupStep === "verify" ? handleVerifyAndSignup : handleSendCode} className="space-y-4">
                  {signupStep === "details" ? (
                    <>
                      <div>
                        <Label htmlFor="auth-name">Full Name</Label>
                        <div className="relative mt-1">
                          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="auth-name"
                            placeholder="Adebayo Ogunlesi"
                            className="pl-10"
                            value={authForm.name}
                            onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="auth-estate">Estate / Community</Label>
                        <div className="relative mt-1">
                          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="auth-estate"
                            placeholder="e.g., Lekki Gardens Phase 3"
                            className="pl-10"
                            value={authForm.estate}
                            onChange={(e) => setAuthForm((p) => ({ ...p, estate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="auth-email">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="auth-email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            value={authForm.email}
                            onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="auth-password">Password</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="auth-password"
                            type="password"
                            placeholder="Create a password"
                            className="pl-10"
                            value={authForm.password}
                            onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                          />
                        </div>
                      </div>

                      {authError && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{authError}</p>
                      )}

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isAuthLoading}>
                        {isAuthLoading && (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        )}
                        Send Verification Code
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="auth-code">Verification Code</Label>
                        <div className="relative mt-1">
                          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="auth-code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            className="pl-10 text-center text-lg tracking-[0.5em] font-mono"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                            autoFocus
                          />
                        </div>
                      </div>

                      {devCode && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Development mode — Your code:</p>
                          <p className="text-lg font-mono font-bold text-green-700 tracking-widest">{devCode}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => { setSignupStep("details"); setVerificationCode(""); setAuthError(""); }}
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={codeCooldown > 0 || isAuthLoading}
                          className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                        >
                          {codeCooldown > 0 ? `Resend in ${codeCooldown}s` : "Resend code"}
                        </button>
                      </div>

                      {authError && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{authError}</p>
                      )}

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isAuthLoading}>
                        {isAuthLoading && (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        )}
                        Verify & Create Account
                      </Button>
                    </>
                  )}
                </form>
              )}

              <Separator className="my-6" />

              <p className="text-center text-sm text-muted-foreground">
                {authMode === "login" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button onClick={() => { setAuthMode("signup"); resetAuth(); }} className="text-primary font-medium hover:underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => { setAuthMode("login"); resetAuth(); }} className="text-primary font-medium hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
