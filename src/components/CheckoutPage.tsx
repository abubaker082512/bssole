import React, { useMemo, useState } from 'react';
import type { CartItem } from '../types';

type Props = {
  cart: CartItem[];
  onBack: () => void;
  onSuccess: (orderId: number | string) => void;
  session?: any;
};

export default function CheckoutPage({ cart, onBack, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [line1, setLine1] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const cartTotal = useMemo(() => cart.reduce((a, c) => a + c.price * c.quantity, 0), [cart]);

  const canProceedAddress = name.trim() !== '' && email.trim() !== '' && line1.trim() !== '' && city.trim() !== '' && postalCode.trim() !== '';

  const placeOrder = async () => {
    setError(null);
    if (!cart || cart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    if (!canProceedAddress) {
      setError('Please fill in all address fields');
      return;
    }
    const items = cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price }));
    // Try to use a session user id if available; otherwise ODIN will create a guest order
    const customer_id = undefined; // letting backend attempt to create/fetch customer by email if needed
    const payload = {
      customer_id,
      customer_email: email,
      items,
      total: cartTotal,
      address: { name, email, phone, line1, city, postalCode }
    } as any;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Failed to place order');
      }
      const data = await res.json();
      const orderId = data?.orderId ?? data?.id ?? data?.order?.id;
      onSuccess(orderId);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to place order');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h2 className="text-3xl font-serif font-bold mb-6">Checkout</h2>
      {step === 1 && (
        <section className="bg-[#050505] border border-white/5 p-6 md:p-12 mb-8">
          <h3 className="text-xl mb-4">Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="Address Line 1" value={line1} onChange={e => setLine1(e.target.value)} />
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
            <input className="bg-transparent border-b border-white/10 py-3" placeholder="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
          </div>
          <div className="mt-6 flex justify-end">
            <button disabled={!canProceedAddress} onClick={() => setStep(2)} className="btn-luxury">Continue to Review</button>
          </div>
        </section>
      )}
      {step >= 2 && (
        <section className="bg-[#050505] border border-white/5 p-6 md:p-12 mb-8">
          <h3 className="text-xl mb-4">Review Order</h3>
          <div className="space-y-4 max-h-48 overflow-auto">
            {cart.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.name} x{it.quantity}</span>
                <span>RS. {(it.price * it.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <strong>Total</strong>
            <strong>RS. {cartTotal.toLocaleString()}</strong>
          </div>
          {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
          <div className="mt-6 flex justify-between">
            <button onClick={onBack} className="btn-luxury">Back</button>
            <button onClick={placeOrder} className="btn-luxury">Place Order (COD)</button>
          </div>
        </section>
      )}
    </div>
  );
}
