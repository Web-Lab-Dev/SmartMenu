# Happy Hour & Timed Promotions - Implementation Guide

## ✅ What's Been Implemented (Client-Side)

### 1. Type System (`src/types/schema.ts`)
- ✅ `CampaignType`: 'lottery' | 'timed_promotion'
- ✅ `RecurrenceType`: 'one_shot' | 'recurring'
- ✅ `TimedPromotionRules`: dates, days, times
- ✅ `DiscountConfig`: percentage or fixed amount
- ✅ Backward compatible (all new fields optional)

### 2. Utilities (`src/lib/promo-utils.ts`)
- ✅ `isPromotionActive()` - Check if promo currently valid
- ✅ `calculateDiscountedPrice()` - Apply discount
- ✅ `isProductEligible()` - Check category targeting
- ✅ `getProductPrice()` - Get final price with discount
- ✅ `getTimeUntilEnd()` - Calculate remaining time
- ✅ `formatTimeRemaining()` - Human-readable countdown
- ✅ `formatPromotionSchedule()` - Display schedule

### 3. Hook (`src/hooks/useActiveCampaign.ts`)
- ✅ Real-time Firestore listener for timed_promotion campaigns
- ✅ Auto-updates every 60s to check time validity
- ✅ Returns: campaign, isActive, timeRemaining, getProductPrice()
- ✅ Client-side filtering by campaign type

### 4. UI Components
- ✅ **PromoBanner**: Sticky top banner with countdown
- ✅ **HeroCard**: Promo badge + strikethrough original price
- ✅ **CompactCard**: Promo badge + strikethrough price
- ✅ **MenuGrid**: Passes promo data to all cards

### 5. Integration
- ✅ Menu page uses `useActiveCampaign` hook
- ✅ Shows PromoBanner if campaign active
- ✅ Product cards show promo pricing
- ✅ Quick-add uses promo price
- ✅ Cart stores discounted prices

## ⏳ What Still Needs To Be Done

### 1. ProductDrawer (`src/components/menu/ProductDrawer.tsx`)
**Status:** Needs update
**What to do:**
```typescript
// Add props to ProductDrawer
interface ProductDrawerProps {
  // ... existing props
  discountedPrice?: number;
  originalPrice?: number;
  promoBadge?: string;
}

// Update price display to show strikethrough if discounted
// Update "Add to Cart" to use discounted price
```

### 2. CartDrawer Promo Display (`src/components/client/CartDrawer.tsx`)
**Status:** Needs visual indicator
**What to do:**
- If `hasActivePromo`, show info banner in cart
- Display: "🔥 Happy Hour actif - Économies appliquées"
- Optional: Show total savings amount

### 3. Admin: TimedPromotionForm Component
**Status:** Not started
**Location:** Create `src/components/admin/TimedPromotionForm.tsx`

**Required Fields:**
```typescript
interface FormData {
  name: string;
  recurrence: 'one_shot' | 'recurring';

  // One-shot
  startDate?: Date;
  endDate?: Date;

  // Recurring
  daysOfWeek?: number[]; // Multi-select: [0-6]
  startTime?: string; // "17:00"
  endTime?: string; // "20:00"

  discount: {
    type: 'percentage' | 'fixed';
    value: number;
  };

  targetCategories: string[]; // Multi-select categories
  bannerText: string; // Preview as you type
  isActive: boolean;
}
```

**UI Structure:**
1. Switch: "Événement Unique" vs "Happy Hour Récurrent"
2. If one-shot: Date range picker (startDate, endDate)
3. If recurring: Day selector + Time range
4. Category multi-select (checkboxes)
5. Discount type (radio) + value (input)
6. Banner text (input with live preview)
7. Active toggle

### 4. Marketing Page Update (`src/app/admin/marketing/page.tsx`)
**Status:** Needs two sections
**What to do:**

```tsx
export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'lottery' | 'timed'>('lottery');

  return (
    <AdminPageWrapper>
      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('lottery')}>
          Campagnes Tombola
        </button>
        <button onClick={() => setActiveTab('timed')}>
          Promotions & Happy Hour
        </button>
      </div>

      {/* Content */}
      {activeTab === 'lottery' ? (
        <LotteryCampaignsList /> // Existing code
      ) : (
        <TimedPromotionsList /> // New component
      )}
    </AdminPageWrapper>
  );
}
```

### 5. CampaignService Update
**Status:** Partially done
**What to add:**

```typescript
// In src/services/CampaignService.ts
static async createTimedPromotion(data: {
  restaurantId: string;
  name: string;
  recurrence: RecurrenceType;
  rules: TimedPromotionRules;
  discount: DiscountConfig;
  targetCategories: string[];
  bannerText: string;
  isActive?: boolean;
}): Promise<string> {
  // Validate
  // Create with type: 'timed_promotion'
}
```

## 📝 Testing Checklist

### Manual Tests
- [ ] Create a Happy Hour (Fridays 17:00-20:00, -20%)
- [ ] Verify banner appears at correct time
- [ ] Check product prices update
- [ ] Add item to cart, verify promo price
- [ ] Check countdown shows when < 1h remaining
- [ ] Verify promo deactivates after end time
- [ ] Create one-shot event (Christmas, dates)
- [ ] Test category targeting (only cocktails)
- [ ] Test multiple promotions (only 1 active at a time)

### Edge Cases
- [ ] Promo + Coupon both applied (should stack)
- [ ] Promo ends while item in cart (price stays)
- [ ] Product removed from target category mid-promo
- [ ] Timezone handling (use restaurant timezone)
- [ ] Midnight rollover for recurring promos

## 🚀 Deployment Notes

1. **No migration needed** - All Campaign fields are optional
2. **Backward compatible** - Existing lottery campaigns still work
3. **Firestore indexes**: May need index on `campaigns` where `restaurantId` + `type` + `isActive`

## 📊 Example Campaign Documents

### Happy Hour (Recurring)
```json
{
  "id": "abc123",
  "restaurantId": "rest-001",
  "name": "Happy Hour Vendredi",
  "type": "timed_promotion",
  "recurrence": "recurring",
  "rules": {
    "daysOfWeek": [5], // Friday
    "startTime": "17:00",
    "endTime": "20:00"
  },
  "discount": {
    "type": "percentage",
    "value": 20
  },
  "targetCategories": ["cat-cocktails", "cat-boissons"],
  "bannerText": "🍹 Happy Hour ! -20% sur les cocktails jusqu'à 20h",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Christmas Event (One-Shot)
```json
{
  "id": "xyz789",
  "restaurantId": "rest-001",
  "name": "Spécial Réveillon",
  "type": "timed_promotion",
  "recurrence": "one_shot",
  "rules": {
    "startDate": "2025-12-24T00:00:00Z",
    "endDate": "2025-12-25T23:59:59Z"
  },
  "discount": {
    "type": "fixed",
    "value": 5000 // 5000 FCFA
  },
  "targetCategories": [], // All products
  "bannerText": "🎄 Réveillon de Noël ! -5000F sur toute la carte",
  "isActive": true,
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-01T10:00:00Z"
}
```

## 🎨 Visual Design Reference

### Promo Badge
- Background: `linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)`
- Text: Black `#000000`
- Icon: 🔥
- Text: "HAPPY HOUR" or "PROMO"

### PromoBanner
- Position: `sticky top-0 z-50`
- Background: `linear-gradient(135deg, #FF7D29 0%, #FF5722 100%)`
- Pulse animation on background
- Sparkles icon ✨
- Countdown if < 1h remaining
- Close button (X)

### Price Display
- Original: Strikethrough, small, gray-500
- Discounted: Larger, orange #FF7D29

## 🔗 Related Files
- Types: `src/types/schema.ts`
- Utils: `src/lib/promo-utils.ts`
- Hook: `src/hooks/useActiveCampaign.ts`
- Banner: `src/components/client/PromoBanner.tsx`
- Cards: `src/components/menu/{HeroCard,CompactCard}.tsx`
- Grid: `src/components/menu/MenuGrid.tsx`
- Page: `src/app/menu/[restaurantId]/[tableId]/page.tsx`
- Store: `src/lib/store.ts`
