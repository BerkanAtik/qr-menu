import { NextRequest, NextResponse } from 'next/server'
import { iyzico } from '@/lib/iyzico'
import { supabaseServer } from '@/lib/supabaseServer'

type CheckoutFormRetrieveResult = {
  paymentStatus?: string
  conversationId?: string
  basketId?: string
  paymentId?: string
  paidPrice?: string
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const token = formData.get('token') as string

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  return new Promise<NextResponse>((resolve) => {
    iyzico.checkoutForm.retrieve({ locale: 'tr', token }, async (err: Error | null, result: CheckoutFormRetrieveResult) => {
      // iyzico bazı durumlarda conversationId yerine basketId dönüyor, ikisini de kontrol ediyoruz
      const orderId = result?.conversationId || result?.basketId

      if (err || result?.paymentStatus !== 'SUCCESS') {
        if (orderId) {
          await supabaseServer
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId)
        }
        resolve(
          NextResponse.redirect(new URL('/odeme-sonuc?status=fail', appUrl))
        )
        return
      }

      const { error: paymentError } = await supabaseServer.from('payments').insert({
        order_id: orderId,
        provider: 'iyzico',
        provider_ref: result.paymentId,
        status: 'success',
        amount: result.paidPrice,
      })
      if (paymentError) console.log('PAYMENTS INSERT HATASI:', paymentError)

      const { error: orderError } = await supabaseServer
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', orderId)
      if (orderError) console.log('ORDERS UPDATE HATASI:', orderError)

      resolve(
        NextResponse.redirect(new URL('/odeme-sonuc?status=success', appUrl))
      )
    })
  })
}