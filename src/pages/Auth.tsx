import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, Eye, EyeOff, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link sent!" });
        setForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "Check your email to verify." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: "AI-Powered Diagnosis" },
    { icon: Shield, text: "Secure & Private" },
    { icon: Zap, text: "Instant Results" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute top-0 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-32 -left-20 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

      {/* Header */}
      <div className="relative gradient-header px-6 pt-14 pb-12 rounded-b-[2.5rem]">
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem]">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-4 -left-8 w-32 h-32 rounded-full bg-white/5" />
        </div>
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Heart className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-extrabold text-primary-foreground tracking-tight"
          >
            Care Fusion
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-primary-foreground/70 mt-1 font-medium"
          >
            Your AI Health Companion
          </motion.p>
        </div>
      </div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative flex gap-2 justify-center px-5 -mt-5"
      >
        {features.map((f, i) => (
          <div key={i} className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <f.icon className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{f.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Form */}
      <div className="relative flex-1 px-5 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-3xl p-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-0.5">
            {forgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {forgotPassword
              ? "We'll send you a reset link"
              : isLogin
              ? "Sign in to your health dashboard"
              : "Start your health journey today"}
          </p>

          <form onSubmit={handleAuth} className="space-y-3.5">
            {!isLogin && !forgotPassword && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm"
              />
            </div>
            {!forgotPassword && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            )}

            {isLogin && !forgotPassword && (
              <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-primary font-semibold hover:underline">
                Forgot Password?
              </button>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm glow-sm">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Please wait...
                </div>
              ) : forgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            {forgotPassword ? (
              <button onClick={() => setForgotPassword(false)} className="text-sm text-primary font-semibold">
                ← Back to Sign In
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLogin ? "New to Care Fusion?" : "Already have an account?"}{" "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold">
                  {isLogin ? "Create Account" : "Sign In"}
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
