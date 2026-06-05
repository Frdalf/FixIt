import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      services,
      deviceName,
      deviceType,
      locationAddress,
      locationLat,
      locationLng,
      locationNotes,
      orderNotes,
      paymentMethod,
      vaBank,
      subtotal,
      adminFee,
      total,
      pelangganId,
    } = body

    const supabase = createClient()

    // 1. Generate unique human-readable order code
    const orderCode = `FIX-${Date.now().toString().slice(-8)}`

    // 2. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        pelanggan_id: pelangganId,
        status: 'menunggu',
        device_name: deviceName,
        device_type: deviceType,
        location_address: locationAddress,
        location_lat: locationLat,
        location_lng: locationLng,
        location_notes: locationNotes,
        order_notes: orderNotes,
        subtotal,
        admin_fee: adminFee,
        total,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { message: orderError?.message || 'Gagal menyimpan pesanan' },
        { status: 500 }
      )
    }

    // 3. Create order items (using null reference for local fallback string IDs)
    const orderItems = services.map((svc: any) => {
      const isMockId =
        svc.id.startsWith('h') ||
        svc.id.startsWith('s') ||
        svc.id.startsWith('c') ||
        svc.id.startsWith('e')

      return {
        order_id: order.id,
        service_id: isMockId ? null : svc.id,
        service_name: svc.name,
        price: svc.price_min,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Clean up order to keep DB integrity
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { message: itemsError.message || 'Gagal menyimpan item layanan' },
        { status: 500 }
      )
    }

    // 4. Create the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        method: paymentMethod,
        va_bank: vaBank,
        amount: total,
        status: 'pending',
      })
      .select()
      .single()

    if (paymentError || !payment) {
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { message: paymentError?.message || 'Gagal memproses detail pembayaran' },
        { status: 500 }
      )
    }

    // 5. Check if Midtrans is configured
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const hasMidtrans = serverKey && !serverKey.startsWith('your-')

    if (!hasMidtrans) {
      // Mock mode
      return NextResponse.json({
        isMock: true,
        orderId: order.id,
        paymentId: payment.id,
      })
    }

    // Call Midtrans Snap Endpoint
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const midtransUrl = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    const authHeader = Buffer.from(`${serverKey}:`).toString('base64')

    const midtransBody = {
      transaction_details: {
        order_id: payment.id,
        gross_amount: total,
      },
      item_details: [
        ...services.map((svc: any) => ({
          id: svc.id,
          price: svc.price_min,
          quantity: 1,
          name: svc.name.slice(0, 50),
        })),
        {
          id: 'admin_fee',
          price: adminFee,
          quantity: 1,
          name: 'Biaya Kunjungan & Admin',
        },
      ],
      customer_details: {
        first_name: orderCode,
      },
    }

    const midtransRes = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(midtransBody),
    })

    const midtransData = await midtransRes.json()

    if (!midtransRes.ok) {
      console.warn('Failed to register payment on Midtrans API. Falling back to Mock.', midtransData)
      return NextResponse.json({
        isMock: true,
        orderId: order.id,
        paymentId: payment.id,
      })
    }

    // Update payment record with snap details
    await supabase
      .from('payments')
      .update({
        midtrans_order_id: payment.id,
        midtrans_token: midtransData.token,
        midtrans_redirect: midtransData.redirect_url,
      })
      .eq('id', payment.id)

    return NextResponse.json({
      isMock: false,
      orderId: order.id,
      paymentId: payment.id,
      midtransToken: midtransData.token,
    })
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Terjadi kesalahan internal server' },
      { status: 500 }
    )
  }
}
