import { NextRequest, NextResponse } from 'next/server'
import { iyzico } from '@/lib/iyzico'
import { supabaseServer } from '@/lib/supabaseServer'
import Iyzipay from 'iyzipay'

type OrderItemRow = {
  quantity: number
  unit_price: number
  product_id: string
  products: { name: string } | null
}

type CheckoutFormInitializeResult = {
  status?: string
  errorMessage?: string
  paymentPageUrl?: string
}

export async function POST(req: NextRequest) {
  const { orderId, buyerName, buyerEmail } = await req.json()

  // Sipariş bilgisini veritabanından doğrula (tutarı client'tan güvenmeden kendimiz hesaplıyoruz)
  const { data: orderItems, error: itemsError } = await supabaseServer
    .from('order_items')
    .select('quantity, unit_price, product_id, products(name)')
    .eq('order_id', orderId)

  if (itemsError || !orderItems || orderItems.length === 0) {
    return NextResponse.json({ error: 'Sipariş kalemleri bulunamadı' }, { status: 400 })
  }

  const typedOrderItems = orderItems as unknown as OrderItemRow[]

  const totalPrice = typedOrderItems
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    .toFixed(2)

  const basketItems = typedOrderItems.map((item, idx) => ({
    id: item.product_id,
    name: item.products?.name || `Ürün ${idx + 1}`,
    category1: 'Yemek',
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: (item.quantity * item.unit_price).toFixed(2),
  }))

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: orderId,
    price: totalPrice,
    paidPrice: totalPrice,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: orderId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
    enabledInstallments: [1],
    buyer: {
      id: 'guest',
      name: buyerName || 'Misafir',
      surname: 'Müşteri',
      gsmNumber: '+905000000000',
      email: buyerEmail || 'misafir@example.com',
      identityNumber: '11111111111',
      registrationAddress: 'Restoran içi sipariş',
      ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
      city: 'Istanbul',
      country: 'Turkey',
    },
    shippingAddress: {
      contactName: buyerName || 'Misafir',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Restoran içi teslimat',
    },
    billingAddress: {
      contactName: buyerName || 'Misafir',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Restoran içi teslimat',
    },
    basketItems,
  }

  return new Promise<NextResponse>((resolve) => {
    iyzico.checkoutFormInitialize.create(request, (err: Error | null, result: CheckoutFormInitializeResult) => {
      if (err || result.status !== 'success') {
        resolve(
          NextResponse.json(
            { error: err?.message || result?.errorMessage || 'Ödeme başlatılamadı' },
            { status: 400 }
          )
        )
        return
      }
      resolve(NextResponse.json({ paymentPageUrl: result.paymentPageUrl }))
    })
  })
}