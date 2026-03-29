import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';

export default function Legal() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/30 bg-card/30">
        <div className="container py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>
      </div>

      <section className="section">
        <div className="container max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
            Informations <span className="text-primary">légales</span>
          </h1>

          {/* Mentions légales */}
          <div id="mentions" className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Mentions légales</h2>
            <div className="glass-card p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p><strong className="text-foreground">Raison sociale :</strong> Toujours + SAS</p>
              <p><strong className="text-foreground">Siège social :</strong> Paris, France</p>
              <p><strong className="text-foreground">Email :</strong> hello@toujoursplus.shop</p>
              <p><strong className="text-foreground">Hébergeur :</strong> Vercel Inc. — 440 N Barranca Ave, Covina, CA 91723, USA</p>
              <p>Le site toujoursplus.shop est édité par la société Toujours + SAS. Toute reproduction, même partielle, du contenu de ce site est interdite sans autorisation préalable.</p>
            </div>
          </div>

          {/* CGV */}
          <div id="cgv" className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Conditions Générales de Vente</h2>
            <div className="glass-card p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <h3 className="text-foreground font-semibold">Article 1 — Objet</h3>
              <p>Les présentes CGV régissent les ventes de produits effectuées via le site toujoursplus.shop.</p>
              <h3 className="text-foreground font-semibold">Article 2 — Prix</h3>
              <p>Les prix sont indiqués en euros TTC. Les frais de livraison sont offerts à partir de 50 € d'achat. En dessous, un forfait de 5 € s'applique.</p>
              <h3 className="text-foreground font-semibold">Article 3 — Commande</h3>
              <p>La validation du paiement constitue l'acceptation des présentes CGV. Un email de confirmation est envoyé après chaque commande.</p>
              <h3 className="text-foreground font-semibold">Article 4 — Livraison</h3>
              <p>Les commandes sont expédiées sous 3 à 5 jours ouvrés. La livraison est effectuée à l'adresse indiquée lors de la commande.</p>
              <h3 className="text-foreground font-semibold">Article 5 — Retours</h3>
              <p>Conformément à la législation, vous disposez d'un délai de 14 jours à compter de la réception pour retourner un article. Les frais de retour sont à la charge du client.</p>
              <h3 className="text-foreground font-semibold">Article 6 — Paiement</h3>
              <p>Le paiement est sécurisé par Stripe. Vos données bancaires ne transitent jamais par nos serveurs.</p>
            </div>
          </div>

          {/* Politique de confidentialité */}
          <div id="privacy" className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Politique de confidentialité</h2>
            <div className="glass-card p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <h3 className="text-foreground font-semibold">Données collectées</h3>
              <p>Nous collectons uniquement les données nécessaires au traitement de vos commandes : nom, email, adresse de livraison et informations de paiement (traitées par Stripe).</p>
              <h3 className="text-foreground font-semibold">Utilisation des données</h3>
              <p>Vos données sont utilisées exclusivement pour le traitement de vos commandes et la communication relative à celles-ci. Nous ne revendons jamais vos données à des tiers.</p>
              <h3 className="text-foreground font-semibold">Cookies</h3>
              <p>Le site utilise un cookie de session technique (authentification). Aucun cookie de tracking publicitaire n'est utilisé.</p>
              <h3 className="text-foreground font-semibold">Vos droits (RGPD)</h3>
              <p>Conformément au Règlement Général sur la Protection des Données, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à hello@toujoursplus.shop.</p>
              <h3 className="text-foreground font-semibold">Durée de conservation</h3>
              <p>Les données de compte sont conservées tant que le compte est actif. Les données de commande sont conservées 5 ans conformément aux obligations légales.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
