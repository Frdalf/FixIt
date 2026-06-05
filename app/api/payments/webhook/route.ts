import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoAssignTechnician } from '@/lib/autoAssign'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // 1. Check if it's a Simulated Mock Webhook
    if (body.isMock) {
      const { orderId, paymentId, status } = body

      // Update payment record
      const { data: payment, error: payError } = await supabase
        .from('payments')
        .update({
          status: status, // 'paid' or 'failed'
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (payError) {
        return NextResponse.json({ message: 'Gagal memperbarui pembayaran' }, { status: 500 })
      }

      if (status === 'paid') {
        // Update order status
        await supabase
          .from('orders')
          .update({
            status: 'dikonfirmasi',
          })
          .eq('id', orderId)

        // Trigger Auto Assignment
        const assignResult = await autoAssignTechnician(supabase, orderId)
        console.log('Mock Auto-Assign Result:', assignResult)

        return NextResponse.json({
          message: 'Simulasi sukses diproses',
          paymentStatus: 'paid',
          assign: assignResult,
        })
      } else {
        // Cancel order on failed payment
        await supabase
          .from('orders')
          .update({
            status: 'dibatalkan',
            cancelled_at: new Date().toISOString(),
            cancel_reason: 'Pembayaran simulasi gagal atau kedaluwarsa',
          })
          .eq('id', orderId)

        return NextResponse.json({
          message: 'Simulasi gagal diproses',
          paymentStatus: 'failed',
        })
      }
    }

    // 2. Midtrans Webhook Callback Verification
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const {
      order_id, // This is payment.id from our database
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    // Verify Signature Key
    if (serverKey) {
      const payload = order_id + status_code + gross_amount + serverKey
      const calculatedSignature = crypto
        .createHash('sha512')
        .update(payload)
        .digest('hex')

      if (calculatedSignature !== signature_key) {
        return NextResponse.json({ message: 'Signature Key tidak valid' }, { status: 400 })
      }
    }

    // Fetch matching payment
    const { data: payment, error: fetchPayError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', order_id)
      .single()

    if (fetchPayError || !payment) {
      return NextResponse.json({ message: 'Data pembayaran tidak ditemukan' }, { status: 404 })
    }

    let finalPaymentStatus = 'pending'
    let finalOrderStatus = 'menunggu'
    let isPaid = false

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        finalPaymentStatus = 'paid'
        finalOrderStatus = 'dikonfirmasi'
        isPaid = true
      }
    } else if (transaction_status === 'settlement') {
      finalPaymentStatus = 'paid'
      finalOrderStatus = 'dikonfirmasi'
      isPaid = true
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      finalPaymentStatus = 'failed'
      finalOrderStatus = 'dibatalkan'
    } else if (transaction_status === 'pending') {
      finalPaymentStatus = 'pending'
    }

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: finalPaymentStatus,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq('id', payment.id)

    // Update corresponding order
    await supabase
      .from('orders')
      .update({
        status: finalOrderStatus,
        cancelled_at: finalPaymentStatus === 'failed' ? new Date().toISOString() : null,
        cancel_reason: finalPaymentStatus === 'failed' ? 'Pembayaran gagal diotorisasi' : null,
      })
      .eq('id', payment.order_id)

    if (isPaid) {
      // Trigger Auto Assignment
      const assignResult = await autoAssignTechnician(supabase, payment.order_id)
      console.log('Webhook Auto-Assign Result:', assignResult)
    }

    return NextResponse.json({ status: 'ok', payment: finalPaymentStatus })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    )
  }
}
