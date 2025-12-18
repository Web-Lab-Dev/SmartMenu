// ========================================
// Login/Register Page
// ========================================
// Admin authentication with Firebase

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.restaurantId) {
      console.log('[Login] User already logged in, redirecting...');
      router.replace('/admin');
    }
  }, [user, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Vérification...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Register new user + create restaurant profile with real data
        await signUp(email, password, restaurantName, ownerName);
        toast.success('Compte créé avec succès ! Votre restaurant est prêt.');
        // Will redirect via useEffect when user is set
      } else {
        // Login existing user
        await signIn(email, password);
        toast.success('Connexion réussie !');
        // Will redirect via useEffect when user is set
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      let message = 'Une erreur est survenue';

      if (error instanceof Error) {
        // Parse Firebase error messages
        if (error.message.includes('wrong-password')) {
          message = 'Mot de passe incorrect';
        } else if (error.message.includes('user-not-found')) {
          message = 'Aucun compte trouvé avec cet email';
        } else if (error.message.includes('email-already-in-use')) {
          message = 'Cet email est déjà utilisé';
        } else if (error.message.includes('weak-password')) {
          message = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (error.message.includes('invalid-email')) {
          message = 'Email invalide';
        } else {
          message = error.message;
        }
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setEmail('');
    setPassword('');
    setRestaurantName('');
    setOwnerName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 shadow-lg shadow-orange-500/50"
          >
            <Store className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">RestoTech</h1>
          <p className="text-gray-400">
            {isRegisterMode ? 'Créez votre restaurant' : 'Administration Dashboard'}
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          key={isRegisterMode ? 'register' : 'login'}
          initial={{ opacity: 0, x: isRegisterMode ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 shadow-2xl"
        >
          {/* Mode Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">
              {isRegisterMode ? 'Créer un compte' : 'Se connecter'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isRegisterMode
                ? 'Démarrez votre restaurant en quelques secondes'
                : 'Accédez à votre dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name - Only in Register Mode */}
            {isRegisterMode && (
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du Restaurant
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Chez Ali"
                    required={isRegisterMode}
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
            )}

            {/* Owner Name - Only in Register Mode */}
            {isRegisterMode && (
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                  Votre Prénom
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ali"
                    required={isRegisterMode}
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              {isRegisterMode && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !email ||
                !password ||
                password.length < 6 ||
                (isRegisterMode && (!restaurantName || !ownerName))
              }
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegisterMode ? 'Création...' : 'Connexion...'}
                </>
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Créer mon restaurant
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Se connecter
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              disabled={isLoading}
              className="text-sm text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              {isRegisterMode ? (
                <>
                  Vous avez déjà un compte ?{' '}
                  <span className="text-orange-400 font-medium">Se connecter</span>
                </>
              ) : (
                <>
                  Pas encore de compte ?{' '}
                  <span className="text-orange-400 font-medium">S'inscrire</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          RestoTech - Système de commande intelligent
        </p>
      </motion.div>
    </div>
  );
}
