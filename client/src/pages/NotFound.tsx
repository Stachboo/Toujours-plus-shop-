import { useLocation } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-3">Page introuvable</h1>
        <p className="text-muted-foreground mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="btn-primary gap-2 px-6 py-3"
          >
            <Home className="w-4 h-4" />
            Accueil
          </button>
          <button
            onClick={() => navigate('/products')}
            className="btn-secondary gap-2 px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Catalogue
          </button>
        </div>
      </div>
    </div>
  );
}
