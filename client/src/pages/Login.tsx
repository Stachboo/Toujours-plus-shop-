import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGoogleOAuthUrl } from "@/const";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la connexion");
    },
  });

  // Check for OAuth error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "oauth_failed") {
      toast.error("La connexion avec Google a echoue. Veuillez reessayer.");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const inputClasses =
    "bg-white/5 border-border/50 focus:border-primary/50 rounded-xl text-foreground placeholder:text-muted-foreground/50";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-wider">
            TOUJOURS +
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Connectez-vous a votre compte
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Votre mot de passe"
                className={inputClasses}
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn-primary py-3 text-base"
              size="lg"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              ou
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full py-3 border-border/50 text-foreground hover:bg-white/5 hover:border-primary/30"
            size="lg"
            asChild
          >
            <a href={getGoogleOAuthUrl()}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Se connecter avec Google
            </a>
          </Button>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Pas encore de compte ?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
