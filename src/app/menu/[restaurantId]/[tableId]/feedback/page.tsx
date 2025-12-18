// ========================================
// Feedback Page
// ========================================
// Customer feedback and rating page

'use client';

import { useParams, useRouter } from 'next/navigation';
import { FeedbackFlow } from '@/components/feedback/FeedbackFlow';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  // Get customer session ID from localStorage
  const customerSessionId = typeof window !== 'undefined'
    ? localStorage.getItem('customerSessionId') || 'demo-session'
    : 'demo-session';

  // Get order ID from session storage (set by split-bill page)
  const splitBillData = typeof window !== 'undefined'
    ? sessionStorage.getItem('split-bill-data')
    : null;

  const orderId = splitBillData
    ? JSON.parse(splitBillData).orderId
    : 'demo-order-id';

  const handleFeedbackComplete = (rating: number) => {
    console.log('[Feedback] Completed with rating:', rating);

    // Navigate to reward/scratch card page
    router.push(`/menu/${restaurantId}/${tableId}/reward`);
  };

  return (
    <FeedbackFlow
      restaurantId={restaurantId}
      orderId={orderId}
      customerSessionId={customerSessionId}
      restaurantName="RestoTech" // TODO: Get from restaurant data
      googleMapsUrl="https://g.page/r/YOUR_PLACE_ID/review" // TODO: Get from restaurant config
      onComplete={handleFeedbackComplete}
    />
  );
}
