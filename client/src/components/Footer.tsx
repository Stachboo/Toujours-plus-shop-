import { useLocation } from 'wouter';
import { LOGOS } from '@/const/logos';
import { Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Merci pour votre intérêt ! La newsletter sera bientôt disponible.');
      setEmail('');
    }
  };

  return (
    <footer className="relative border-t border-border/30 bg-[#0a0908]">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <motion.img
              src={LOGOS.symbolGold}
              alt="Toujours +"
              className="h-16 w-auto mb-6 opacity-80"
              whileHover={{ opacity: 1, scale: 1.02 }}
            />
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              La marque de ceux qui ne font jamais les choses à moitié. Célébrez votre côté excessif avec style.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Twitter, label: 'Twitter' },
              ].map(({ icon: Icon, label }) => (
                <motion.button
                  key={label}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.info('Réseaux sociaux bientôt disponibles !')}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6">
              Boutique
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Catalogue', path: '/products' },
                { label: 'Nouveautés', path: '/products' },
                { label: 'T-Shirts', path: '/products' },
                { label: 'Sweats', path: '/products' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary/60" />
                hello@toujoursplus.shop
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary/60" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary/60" />
                Paris, France
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6">
              Newsletter
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Inscrivez-vous et recevez <span className="text-primary font-semibold">-10%</span> sur votre première commande.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                required
              />
              <button
                type="submit"
                className="w-full btn-primary text-sm py-3"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Toujours +. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {[
              { label: 'Mentions légales', hash: '#mentions' },
              { label: 'CGV', hash: '#cgv' },
              { label: 'Politique de confidentialité', hash: '#privacy' },
            ].map((item) => (
              <button
                key={item.label}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
                onClick={() => navigate(`/legal${item.hash}`)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
