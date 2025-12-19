# 🔥 Orange Bistro Theme - Style Guide

## Palette de Couleurs

### Backgrounds
```tsx
// Noir charbon (fond principal)
className="bg-background"  // #121212

// Surface (cartes, panels)
className="bg-background-surface"  // #1E1E1E

// Avec texture noise
className="bg-background bg-noise"
```

### Primary (Orange Vibrant)
```tsx
// Boutons, CTAs, accents
className="bg-primary"  // #FF7D29
className="text-primary"
className="border-primary"

// Variantes
className="bg-primary-400"  // Standard
className="bg-primary-500"  // Plus intense
className="bg-primary-600"  // Hover states
```

### Texte
```tsx
// Hiérarchie typographique
className="text-text-primary"    // #FFFFFF - Titres, texte important
className="text-text-secondary"  // #A0A0A0 - Descriptions
className="text-text-muted"      // #6B6B6B - Labels, metadata
```

## Typographie

### Display (Oswald) - Pour les Titres
```tsx
// Noms de plats, catégories, headers
<h1 className="font-display text-4xl font-bold text-text-primary">
  MAIN COURSE
</h1>

<h2 className="font-display text-2xl uppercase tracking-wide">
  Cheeseburger
</h2>
```

### Sans (Lato) - Pour le Corps
```tsx
// Descriptions, paragraphes
<p className="font-sans text-base text-text-secondary">
  Delicious + Healthy
</p>
```

## Composants Stylisés

### Card (Style Menu)
```tsx
<div className="bg-background-surface rounded-2xl p-6 border border-primary/20">
  <h3 className="font-display text-xl text-text-primary mb-2">
    APPETIZERS
  </h3>
  <p className="font-sans text-text-secondary">
    Description du plat...
  </p>
</div>
```

### Button Primary (Orange)
```tsx
<button className="
  bg-primary hover:bg-primary-500
  text-white font-display font-semibold
  px-8 py-3 rounded-full
  transition-all duration-300
  shadow-lg hover:shadow-primary/50
">
  COMMANDER
</button>
```

### Button Secondary (Outline)
```tsx
<button className="
  bg-transparent border-2 border-primary
  text-primary hover:bg-primary hover:text-white
  font-display font-semibold
  px-6 py-2 rounded-full
  transition-all duration-300
">
  VOIR PLUS
</button>
```

### Price Tag
```tsx
<span className="
  font-display text-2xl text-primary
  tracking-tight
">
  ₹350
</span>
```

## Layouts

### Page Container (Avec Noise)
```tsx
<main className="min-h-screen bg-background bg-noise">
  <div className="container mx-auto px-4 py-8">
    {/* Content */}
  </div>
</main>
```

### Menu Section
```tsx
<section className="mb-12">
  {/* Header avec accent orange */}
  <div className="inline-block bg-primary px-6 py-2 rounded-lg mb-6">
    <h2 className="font-display text-xl text-black uppercase">
      MAIN COURSE
    </h2>
  </div>

  {/* Items */}
  <div className="space-y-4">
    {items.map(item => (
      <div key={item.id} className="
        bg-background-surface
        rounded-xl p-4
        border border-primary/10
        hover:border-primary/30
        transition-all duration-300
      ">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-display text-lg text-text-primary">
              {item.name}
            </h3>
            <p className="font-sans text-sm text-text-secondary mt-1">
              {item.description}
            </p>
          </div>
          <span className="font-display text-xl text-primary">
            ₹{item.price}
          </span>
        </div>
      </div>
    ))}
  </div>
</section>
```

### Glassmorphism (Navigation/Header)
```tsx
<header className="
  glass-header
  sticky top-0 z-50
  px-6 py-4
">
  <nav className="flex justify-between items-center">
    <h1 className="font-display text-2xl text-text-primary">
      FOOD MENU
    </h1>
    <button className="text-primary">
      ⋯
    </button>
  </nav>
</header>
```

## Images avec Overlay Orange

### Card avec Image
```tsx
<div className="relative overflow-hidden rounded-2xl">
  <img
    src="/burger.jpg"
    alt="Burger"
    className="w-full h-64 object-cover"
  />

  {/* Overlay gradient orange */}
  <div className="
    absolute inset-0
    bg-gradient-to-t from-primary/80 via-transparent to-transparent
  " />

  {/* Contenu par-dessus */}
  <div className="absolute bottom-0 left-0 right-0 p-6">
    <h3 className="font-display text-2xl text-white">
      CHEESEBURGER
    </h3>
    <span className="font-display text-xl text-white/90">
      ₹200
    </span>
  </div>
</div>
```

## Icônes et Badges

### Badge Orange
```tsx
<span className="
  inline-flex items-center gap-2
  bg-primary text-white
  px-4 py-1 rounded-full
  font-display text-sm uppercase
">
  <span>🔥</span>
  Popular
</span>
```

### Divider avec Accent
```tsx
<div className="flex items-center gap-4 my-8">
  <div className="flex-1 h-px bg-text-muted/20" />
  <span className="font-display text-primary">⋯</span>
  <div className="flex-1 h-px bg-text-muted/20" />
</div>
```

## Animations

### Hover Effects
```tsx
// Scale + Shadow
className="
  transform transition-all duration-300
  hover:scale-105
  hover:shadow-2xl hover:shadow-primary/30
"

// Glow Effect
className="
  transition-all duration-300
  hover:ring-4 hover:ring-primary/30
"
```

## Variables CSS Custom

Vous pouvez aussi utiliser les variables CSS directement:

```css
/* Dans votre CSS */
.custom-card {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--brand-color);
}

.custom-button {
  background: var(--brand-color);
  color: white;
}
```

## Exemples Complets

### Menu Item Card
```tsx
function MenuItem({ name, description, price, image, isPopular }) {
  return (
    <div className="
      bg-background-surface
      rounded-2xl overflow-hidden
      border border-primary/10
      hover:border-primary/30
      transition-all duration-300
      hover:scale-[1.02]
      group
    ">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="
            w-full h-full object-cover
            group-hover:scale-110 transition-transform duration-500
          "
        />
        {isPopular && (
          <div className="
            absolute top-4 right-4
            bg-primary text-white
            px-3 py-1 rounded-full
            font-display text-xs uppercase
          ">
            🔥 Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-display text-xl text-text-primary uppercase">
            {name}
          </h3>
          <span className="font-display text-2xl text-primary">
            ₹{price}
          </span>
        </div>

        <p className="font-sans text-sm text-text-secondary mb-4">
          {description}
        </p>

        <button className="
          w-full
          bg-primary hover:bg-primary-500
          text-white font-display font-semibold
          py-3 rounded-full
          transition-all duration-300
          hover:shadow-lg hover:shadow-primary/50
        ">
          AJOUTER AU PANIER
        </button>
      </div>
    </div>
  );
}
```

---

**Note:** Ce thème est optimisé pour les interfaces de type "Menu Restaurant" avec un aspect chaleureux, appétissant et moderne. L'orange vibrant stimule l'appétit, et le fond noir charbon crée un contraste fort qui met en valeur les images de nourriture.
