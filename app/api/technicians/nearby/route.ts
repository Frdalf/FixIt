import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDistance } from '@/lib/haversine'

export async function POST(request: Request) {
  try {
    const { lat, lng, services } = await request.json()

    if (lat === undefined || lng === undefined || !services || !Array.isArray(services)) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createClient()

    // Determine specializations needed
    const neededSpecializations: string[] = []
    
    for (const item of services) {
      const nameLower = (item.name || '').toLowerCase()
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

    if (neededSpecializations.length === 0) {
      neededSpecializations.push('hardware')
    }

    // Query available active technicians
    const { data: technicians, error: techError } = await supabase
      .from('teknisi_profiles')
      .select('*, profiles!inner(*)')
      .eq('status', 'tersedia')
      .eq('profiles.is_active', true)

    if (techError) {
      return NextResponse.json({ message: techError.message }, { status: 500 })
    }

    if (!technicians || technicians.length === 0) {
      return NextResponse.json({ technicians: [] })
    }

    // Filter technicians by specialization and calculate distance
    const candidates = technicians
      .filter((tech) => {
        // Must support at least one needed specialization
        return tech.specializations?.some((spec: string) =>
          neededSpecializations.includes(spec)
        )
      })
      .map((tech) => {
        const dist = getDistance(
          Number(lat),
          Number(lng),
          Number(tech.latitude || 0),
          Number(tech.longitude || 0)
        )
        return {
          id: tech.id,
          name: tech.profiles.full_name,
          avatar_url: tech.profiles.avatar_url,
          distance: dist,
          rating_avg: tech.rating_avg,
          total_jobs: tech.total_jobs,
          specializations: tech.specializations,
        }
      })

    // Sort by distance ascending
    candidates.sort((a, b) => a.distance - b.distance)

    return NextResponse.json({ technicians: candidates })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
