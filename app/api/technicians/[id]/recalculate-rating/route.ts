import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const technicianId = params.id
    if (!technicianId) {
      return NextResponse.json({ error: 'Missing technician id' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Fetch all reviews for this technician
    const { data: allReviews, error: reviewsError } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('teknisi_id', technicianId)

    if (reviewsError) throw reviewsError

    if (allReviews && allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const newAvg = Number((totalRating / allReviews.length).toFixed(2))
      const totalJobs = allReviews.length

      // 2. Update the technician profile
      const { error: updateError } = await adminClient
        .from('teknisi_profiles')
        .update({
          rating_avg: newAvg,
          total_jobs: totalJobs,
        })
        .eq('id', technicianId)

      if (updateError) throw updateError

      return NextResponse.json({ success: true, rating_avg: newAvg, total_jobs: totalJobs })
    }

    return NextResponse.json({ success: true, message: 'No reviews found' })
  } catch (error: any) {
    console.error('Error recalculating rating:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
