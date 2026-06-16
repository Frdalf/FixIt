import { SupabaseClient } from '@supabase/supabase-js'
import { getDistance } from './haversine'

export async function autoAssignTechnician(supabase: SupabaseClient, orderId: string): Promise<{
  success: boolean
  message: string
  assignedTechnicianId?: string
}> {
  try {
    // 1. Fetch Order Details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, message: `Order not found: ${orderError?.message}` }
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
      return { success: false, message: 'No available technicians to broadcast to' }
    }

    // 3. Create Notifications for all available technicians
    const notifications = technicians.map(tech => ({
      user_id: tech.id,
      title: 'Ada Order Baru Tersedia!',
      body: `Order baru perbaikan ${order.device_name} di area Anda. Siapa cepat dia dapat!`,
      type: 'order',
      related_id: orderId,
    }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }

    return {
      success: true,
      message: `Successfully broadcasted to ${technicians.length} technicians`,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Broadcast error occurred' }
  }
}

