export function trackEvent(eventName: string, eventParams: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  variant?: string;
}) {
  trackEvent('add_to_cart', {
    currency: 'NOK',
    value: item.price * (item.quantity || 1),
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        item_variant: item.variant,
      },
    ],
  });
}

export function trackPurchase(order: {
  orderId: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  trackEvent('purchase', {
    transaction_id: order.orderId,
    currency: 'NOK',
    value: order.total,
    items: order.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

export function trackViewItem(item: {
  id: string;
  name: string;
  price: number;
}) {
  trackEvent('view_item', {
    currency: 'NOK',
    value: item.price,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
      },
    ],
  });
}
