import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, Eye, EyeOff, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: t("error"), description: (result.error as Error).message, variant: "destructive" });
      }
      if (result.redirected) return;
    } catch (error: any) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: t("accountCreated"), description: t("checkEmailVerify") });
      }
    } catch (error: any) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: t("aiPoweredDiagnosis") },
    { icon: Shield, text: t("securePrivate") },
    { icon: Zap, text: t("instantResults") },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute top-0 -right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-32 -left-20 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

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
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-3xl font-extrabold text-primary-foreground tracking-tight">{t("careFusion")}</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-sm text-primary-foreground/70 mt-1 font-medium">{t("yourAIHealthCompanion")}</motion.p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="relative flex gap-2 justify-center px-5 -mt-5">
        {features.map((f, i) => (
          <div key={i} className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <f.icon className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">{f.text}</span>
          </div>
        ))}
      </motion.div>

      <div className="relative flex-1 px-5 mt-6">
        <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card rounded-3xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-0.5">
            {isLogin ? t("welcomeBack") : t("createAccount")}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {isLogin ? t("signInToDashboard") : t("startHealthJourney")}
          </p>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 rounded-2xl mb-4 font-semibold text-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("continueWithGoogle")}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">{t("or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleAuth} className="space-y-3.5">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t("fullName")} value={name} onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder={t("emailAddress")} value={email} onChange={(e) => setEmail(e.target.value)}
                required className="pl-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder={t("password")} value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="pl-10 pr-10 h-12 rounded-2xl bg-secondary/60 border-0 text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm glow-sm">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {t("pleaseWait")}
                </div>
              ) : isLogin ? t("signIn") : t("createAccount")}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? t("newToCareFusion") : t("alreadyHaveAccount")}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold">
                {isLogin ? t("createAccount") : t("signIn")}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
