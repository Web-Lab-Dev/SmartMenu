'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { RestaurantService } from '@/services/RestaurantService';
import type { Restaurant, RestaurantBranding } from '@/types/schema';
import { QRCodeSVG } from 'qrcode.react';
import { Save, QrCode, Printer, ExternalLink, Loader2, Palette, Instagram, Facebook, Globe, ChevronDown } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import ImageUpload from '@/components/admin/ImageUpload';
import PhoneMockup from '@/components/admin/PhoneMockup';
import { HexColorPicker } from 'react-colorful';

type TabType = 'brand-studio' | 'tables';

export default function SettingsPage() {
  const { user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabType>('brand-studio');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Brand Studio state (live preview - not saved until user clicks save)
  const [brandingPreview, setBrandingPreview] = useState<RestaurantBranding>({
    primaryColor: '#FF4500',
    secondaryColor: '#FFF5F0',
    fontFamily: 'sans',
    radius: 'md',
    socials: {},
  });


  // Color picker states
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);

  // Tables state
  const [numberOfTables, setNumberOfTables] = useState(10);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!user?.restaurantId) return;

      const data = await RestaurantService.getById(user.restaurantId);
      if (data) {
        setRestaurant(data);

        // Initialize Brand Studio preview with current branding
        setBrandingPreview({
          logoUrl: data.branding?.logoUrl || data.branding?.logo,
          primaryColor: data.branding?.primaryColor || '#FF4500',
          secondaryColor: data.branding?.secondaryColor || '#FFF5F0',
          coverUrl: data.branding?.coverUrl || data.branding?.coverImage,
          fontFamily: data.branding?.fontFamily || 'sans',
          radius: data.branding?.radius || 'md',
          socials: data.branding?.socials || {},
        });
      }
      setLoading(false);
    };

    fetchRestaurant();
  }, [user?.restaurantId]);

  const handleSaveBrandStudio = async () => {
    if (!user?.restaurantId || !restaurant) return;

    setSaving(true);
    try {
      const db = getDb();
      const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, user.restaurantId);

      // Update all branding fields + Google Review URL
      await updateDoc(restaurantRef, {
        'branding.logoUrl': brandingPreview.logoUrl || null,
        'branding.primaryColor': brandingPreview.primaryColor,
        'branding.secondaryColor': brandingPreview.secondaryColor || null,
        'branding.coverUrl': brandingPreview.coverUrl || null,
        'branding.fontFamily': brandingPreview.fontFamily || 'sans',
        'branding.radius': brandingPreview.radius || 'md',
        'branding.socials': brandingPreview.socials || {},
        updatedAt: new Date(),
      });

      toast.success('Branding mis à jour avec succès !');

      // Update local state
      setRestaurant({
        ...restaurant,
        branding: brandingPreview,
      });
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Restaurant introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-gray-400">Configurez votre restaurant et générez vos QR codes</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-1 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('brand-studio')}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
              ${activeTab === 'brand-studio'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Studio
            </div>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`
              flex-1 px-6 py-3 rounded-lg font-semibold transition-all
              ${activeTab === 'tables'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Codes Tables
            </div>
          </button>
        </div>
      </div>

      {/* Brand Studio Section */}
      {activeTab === 'brand-studio' && user?.restaurantId && (
        <div className="flex gap-4 h-[calc(100vh-16rem)] print:hidden">
          {/* Left Column (30%) - Configuration Form */}
          <div className="w-[30%] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Brand Studio</h2>
                <p className="text-sm text-gray-400">Personnalisez l&apos;apparence de votre menu</p>
              </div>

              {/* Logo Upload */}
              <ImageUpload
                label="Logo du restaurant"
                value={brandingPreview.logoUrl}
                onChange={(url) => setBrandingPreview({ ...brandingPreview, logoUrl: url || undefined })}
                restaurantId={user.restaurantId}
                path="logo"
                aspectRatio="square"
                helpText="Logo affiché dans l'en-tête du menu"
              />

              {/* Cover Image Upload */}
              <ImageUpload
                label="Image de couverture (Hero)"
                value={brandingPreview.coverUrl}
                onChange={(url) => setBrandingPreview({ ...brandingPreview, coverUrl: url || undefined })}
                restaurantId={user.restaurantId}
                path="cover"
                aspectRatio="wide"
                helpText="Grande image d'accueil (optionnelle)"
              />

              {/* Primary Color */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur principale
                </label>
                <div className="flex gap-3 items-start">
                  {/* Color Preview Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrimaryPicker(!showPrimaryPicker);
                      setShowSecondaryPicker(false);
                    }}
                    className="w-14 h-14 rounded-xl border-2 border-gray-600 hover:border-orange-500 transition-all cursor-pointer shadow-lg flex items-center justify-center group relative"
                    style={{ backgroundColor: brandingPreview.primaryColor }}
                  >
                    <ChevronDown className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </button>

                  {/* Hex Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandingPreview.primaryColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                          setBrandingPreview({ ...brandingPreview, primaryColor: value });
                        }
                      }}
                      onFocus={() => setShowPrimaryPicker(true)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-mono uppercase"
                      placeholder="#FF4500"
                      maxLength={7}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cliquez pour ouvrir le sélecteur</p>
                  </div>
                </div>

                {/* Color Picker Dropdown */}
                {showPrimaryPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-gray-800 rounded-xl border border-gray-600 p-4 shadow-2xl">
                    <HexColorPicker
                      color={brandingPreview.primaryColor}
                      onChange={(color) => setBrandingPreview({ ...brandingPreview, primaryColor: color })}
                      style={{ width: '280px', height: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrimaryPicker(false)}
                      className="mt-3 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Color */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur secondaire (optionnelle)
                </label>
                <div className="flex gap-3 items-start">
                  {/* Color Preview Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecondaryPicker(!showSecondaryPicker);
                      setShowPrimaryPicker(false);
                    }}
                    className="w-14 h-14 rounded-xl border-2 border-gray-600 hover:border-orange-500 transition-all cursor-pointer shadow-lg flex items-center justify-center group relative"
                    style={{ backgroundColor: brandingPreview.secondaryColor || '#FFF5F0' }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                  </button>

                  {/* Hex Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandingPreview.secondaryColor || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                          setBrandingPreview({ ...brandingPreview, secondaryColor: value || undefined });
                        }
                      }}
                      onFocus={() => setShowSecondaryPicker(true)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-mono uppercase"
                      placeholder="#FFF5F0"
                      maxLength={7}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cliquez pour ouvrir le sélecteur</p>
                  </div>
                </div>

                {/* Color Picker Dropdown */}
                {showSecondaryPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-gray-800 rounded-xl border border-gray-600 p-4 shadow-2xl">
                    <HexColorPicker
                      color={brandingPreview.secondaryColor || '#FFF5F0'}
                      onChange={(color) => setBrandingPreview({ ...brandingPreview, secondaryColor: color })}
                      style={{ width: '280px', height: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecondaryPicker(false)}
                      className="mt-3 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Typographie
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sans', 'serif', 'mono'] as const).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setBrandingPreview({ ...brandingPreview, fontFamily: font })}
                      className={`
                        px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm
                        ${brandingPreview.fontFamily === font
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-500/50'
                        }
                      `}
                    >
                      {font === 'sans' && 'Sans'}
                      {font === 'serif' && 'Serif'}
                      {font === 'mono' && 'Mono'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Forme des boutons
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'sm', 'md', 'full'] as const).map((rad) => (
                    <button
                      key={rad}
                      type="button"
                      onClick={() => setBrandingPreview({ ...brandingPreview, radius: rad })}
                      className={`
                        px-3 py-3 border-2 transition-all font-medium text-xs
                        ${brandingPreview.radius === rad
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-500/50'
                        }
                      `}
                      style={{
                        borderRadius: rad === 'none' ? '0' : rad === 'sm' ? '0.375rem' : rad === 'md' ? '0.5rem' : '9999px'
                      }}
                    >
                      {rad === 'none' && 'Carré'}
                      {rad === 'sm' && 'Petit'}
                      {rad === 'md' && 'Moyen'}
                      {rad === 'full' && 'Rond'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Réseaux sociaux (optionnel)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500 shrink-0" />
                    <input
                      type="url"
                      value={brandingPreview.socials?.instagram || ''}
                      onChange={(e) => setBrandingPreview({
                        ...brandingPreview,
                        socials: { ...brandingPreview.socials, instagram: e.target.value || undefined }
                      })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      placeholder="https://instagram.com/restaurant"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-500 shrink-0" />
                    <input
                      type="url"
                      value={brandingPreview.socials?.facebook || ''}
                      onChange={(e) => setBrandingPreview({
                        ...brandingPreview,
                        socials: { ...brandingPreview.socials, facebook: e.target.value || undefined }
                      })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      placeholder="https://facebook.com/restaurant"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-500 shrink-0" />
                    <input
                      type="url"
                      value={brandingPreview.socials?.website || ''}
                      onChange={(e) => setBrandingPreview({
                        ...brandingPreview,
                        socials: { ...brandingPreview.socials, website: e.target.value || undefined }
                      })}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      placeholder="https://mon-restaurant.com"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveBrandStudio}
                disabled={saving}
                className="w-full px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder le branding
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (66%) - Live Preview */}
          <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center">
            <PhoneMockup
              restaurantName={restaurant?.name || 'Mon Restaurant'}
              branding={brandingPreview}
            />
          </div>
        </div>
      )}

      {/* QR Codes Section */}
      {activeTab === 'tables' && (
        <div>
          {/* Controls (Hidden on print) */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-6 mb-6 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de tables
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfTables}
                  onChange={(e) => setNumberOfTables(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </div>

              <button
                onClick={handlePrint}
                className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap"
              >
                <Printer className="w-5 h-5" />
                Imprimer les QR Codes
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Astuce :</strong> Cliquez sur &quot;Imprimer&quot; pour obtenir une version optimisée pour l&apos;impression. Vous pouvez ensuite enregistrer en PDF ou imprimer directement.
              </p>
            </div>
          </div>

          {/* QR Codes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:gap-8">
            {Array.from({ length: numberOfTables }, (_, i) => {
              const tableNumber = i + 1;
              const qrUrl = `${baseUrl}/menu/${restaurant.slug}/table-${tableNumber}`;

              return (
                <div
                  key={tableNumber}
                  className="bg-white rounded-lg p-6 border-2 border-gray-200 print:border-gray-300 print:break-inside-avoid"
                >
                  {/* Table Title */}
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                    Table {tableNumber}
                  </h3>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="H"
                      includeMargin
                      className="border-4 border-gray-100 rounded-lg"
                    />
                  </div>

                  {/* Test Link (Hidden on print) */}
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors print:hidden"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir le menu
                  </a>

                  {/* URL for print */}
                  <p className="hidden print:block text-xs text-gray-600 text-center mt-2 break-all">
                    {qrUrl}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
