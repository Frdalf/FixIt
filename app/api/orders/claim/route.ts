import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { orderId, teknisiId } = await request.json()

    if (!orderId || !teknisiId) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch technician to get their name
    const { data: tech, error: techError } = await supabase
      .from('teknisi_profiles')
      .select('*, profiles!inner(*)')
      .eq('id', teknisiId)
      .single()

    if (techError || !tech) {
      return NextResponse.json({ message: 'Profil teknisi tidak ditemukan' }, { status: 404 })
    }

    // 2. Race-condition safe claim: Update ONLY if status is 'menunggu_teknisi' and teknisi_id is null
    const { data: orderUpdate, error: orderError } = await supabase
      .from('orders')
      .update({
        teknisi_id: teknisiId,
        status: 'dikonfirmasi',
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'menunggu_teknisi')
      .is('teknisi_id', null)
      .select()
      .single()

    if (orderError || !orderUpdate) {
      return NextResponse.json({ 
        message: 'Order sudah kedaluwarsa atau sudah diambil teknisi lain.' 
      }, { status: 409 })
    }

    // 3. Update Technician Status
    await supabase
      .from('teknisi_profiles')
      .update({
        status: 'bertugas',
        updated_at: new Date().toISOString(),
      })
      .eq('id', teknisiId)

    // 4. Create Notifications
    // Customer
    await supabase.from('notifications').insert({
      user_id: orderUpdate.pelanggan_id,
      title: 'Teknisi Sedang Menuju Lokasi!',
      body: `Teknisi ${tech.profiles.full_name} telah mengambil pekerjaan Anda dan bersiap menuju lokasi.`,
      type: 'order',
      related_id: orderId,
    })

    // Technician
    await supabase.from('notifications').insert({
      user_id: teknisiId,
      title: 'Order Berhasil Diambil',
      body: `Anda berhasil mengambil order perbaikan ${orderUpdate.device_name}. Segera menuju ke lokasi.`,
      type: 'order',
      related_id: orderId,
    })

    // 5. Initialize Chat
    const { data: chat } = await supabase
      .from('chats')
      .insert({ order_id: orderId })
      .select()
      .single()

    if (chat) {
      // Send automated introductory message
      await supabase.from('messages').insert({
        chat_id: chat.id,
        content: `Halo, saya teknisi ${tech.profiles.full_name} yang telah menerima order Anda. Saya akan segera meluncur ke lokasi Anda.`,
      })
    }

    return NextResponse.json({ success: true, message: 'Order berhasil diambil' })

  } catch (err: any) {
    console.error('Claim order error:', err)
    return NextResponse.json(
      { message: err.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    )
  }
}
