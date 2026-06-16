import { SupabaseClient } from '@supabase/supabase-js'
import { getDistance } from './haversine'

export async function autoAssignTechnician(supabase: SupabaseClient, orderId: string): Promise<{
  success: boolean
  message: string
  assignedTechnicianId?: string
}> {
  try {
    // 1. Fetch Order Details with Items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, message: `Order not found: ${orderError?.message}` }
    }

    // Determine specializations needed (e.g. ['hardware', 'software', 'cleaning', 'estetika'])
    // We can infer this from the services in the order.
    // Since we know categories map to 'hardware', 'software', 'cleaning', 'estetika':
    const neededSpecializations: string[] = []
    
    // We check the service name or category mapping
    for (const item of order.order_items || []) {
      const nameLower = item.service_name.toLowerCase()
      if (nameLower.includes('lcd') || nameLower.includes('baterai') || nameLower.includes('keyboard') || nameLower.includes('ram') || nameLower.includes('ssd') || nameLower.includes('port') || nameLower.includes('screen') || nameLower.includes('hardware')) {
        if (!neededSpecializations.includes('hardware')) neededSpecializations.push('hardware')
      }
      if (nameLower.includes('install') || nameLower.includes('os') || nameLower.includes('sistem') || nameLower.includes('virus') || nameLower.includes('malware') || nameLower.includes('data') || nameLower.includes('backup') || nameLower.includes('aplikasi') || nameLower.includes('software')) {
        if (!neededSpecializations.includes('software')) neededSpecializations.push('software')
      }
      if (nameLower.includes('clean') || nameLower.includes('cleaning') || nameLower.includes('fan') || nameLower.includes('thermal paste')) {
        if (!neededSpecializations.includes('cleaning')) neededSpecializations.push('cleaning')
      }
      if (nameLower.includes('skin') || nameLower.includes('tempered') || nameLower.includes('gores') || nameLower.includes('estetika') || nameLower.includes('proteksi')) {
        if (!neededSpecializations.includes('estetika')) neededSpecializations.push('estetika')
      }
    }

    // Default fallback to hardware if empty
    if (neededSpecializations.length === 0) {
      neededSpecializations.push('hardware')
    }

    // 2. Query available active technicians
    const { data: technicians, error: techError } = await supabase
      .from('teknisi_profiles')
      .select('*, profiles!inner(*)')
      .eq('status', 'tersedia')
      .eq('profiles.is_active', true)

    if (techError) {
      return { success: false, message: `Failed to fetch technicians: ${techError.message}` }
    }

    if (!technicians || technicians.length === 0) {
      return { success: false, message: 'No available technicians' }
    }

    // 3. Filter technicians by specialization and calculate distance
    const candidates = technicians
      .filter((tech) => {
        // Must support at least one needed specialization
        return tech.specializations.some((spec: string) =>
          neededSpecializations.includes(spec)
        )
      })
      .map((tech) => {
        const dist = getDistance(
          Number(order.location_lat || 0),
          Number(order.location_lng || 0),
          Number(tech.latitude || 0),
          Number(tech.longitude || 0)
        )
        return {
          id: tech.id,
          name: tech.profiles.full_name,
          distance: dist,
        }
      })

    if (candidates.length === 0) {
      return { success: false, message: 'No technicians match the required specialties' }
    }

    // 4. Sort by distance ascending
    candidates.sort((a, b) => a.distance - b.distance)
    const nearestTech = candidates[0]

    // 5. Update Order and Technician status
    // Assign order to technician
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        teknisi_id: nearestTech.id,
        status: 'dikonfirmasi',
        scheduled_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateOrderError) {
      return { success: false, message: `Failed to update order assignment: ${updateOrderError.message}` }
    }

    // Update technician availability status to bertugas
    await supabase
      .from('teknisi_profiles')
      .update({
        status: 'bertugas',
        updated_at: new Date().toISOString(),
      })
      .eq('id', nearestTech.id)

    // 6. Create Notifications
    // Notification for customer
    await supabase.from('notifications').insert({
      user_id: order.pelanggan_id,
      title: 'Teknisi Dialokasikan',
      body: `Teknisi ${nearestTech.name} telah terpilih dan siap meluncur ke lokasi Anda.`,
      type: 'order',
      related_id: orderId,
    })

    // Notification for technician
    await supabase.from('notifications').insert({
      user_id: nearestTech.id,
      title: 'Tugas Baru Diterima',
      body: `Anda mendapatkan order perbaikan ${order.device_name} untuk ${order.location_address}.`,
      type: 'order',
      related_id: orderId,
    })

    // Initialize chat session automatically
    const { data: chat } = await supabase
      .from('chats')
      .insert({ order_id: orderId })
      .select()
      .single()

    if (chat) {
      // Send automated introductory message
      await supabase.from('messages').insert({
        chat_id: chat.id,
        content: `Halo, saya teknisi ${nearestTech.name} yang bertugas melayani perbaikan laptop Anda. Saya akan segera menuju lokasi Anda.`,
      })
    }

    return {
      success: true,
      message: `Successfully assigned to ${nearestTech.name} (${nearestTech.distance.toFixed(2)} km away)`,
      assignedTechnicianId: nearestTech.id,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Auto assign error occurred' }
  }
}
