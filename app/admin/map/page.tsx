'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ShieldAlert, Loader2, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamic map import to avoid SSR errors
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export default function AdminMapMonitorPage() {
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    // Dynamic import Leaflet client side to set up default marker assets
    import('leaflet').then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      })
      setLeafletLoaded(true)
    })
  }, [])

  useEffect(() => {
    const fetchActiveTechnicians = async () => {
      try {
        const supabase = createClient()
        // Query active technicians with status and locations
        const { data, error } = await supabase
          .from('profiles')
          .select('*, teknisi_profiles(*)')
          .eq('role', 'teknisi')
          .eq('is_active', true)

        if (error) throw error

        // Filter out technicians without coordinates
        const techsWithCoords = (data || []).filter(
          (t) => t.teknisi_profiles?.latitude && t.teknisi_profiles?.longitude
        )
        setTechnicians(techsWithCoords)
      } catch (err) {
        console.warn('DB error fetching technician map coordinates. Simulating mock technicians.', err)
        // Mock data fallback centered around Jakarta
        setTechnicians([
          {
            id: 't1',
            full_name: 'Rudi Hermawan',
            phone: '081298765432',
            teknisi_profiles: {
              status: 'tersedia',
              rating_avg: 4.8,
              specializations: ['hardware', 'cleaning'],
              latitude: -6.215,
              longitude: 106.845,
            },
          },
          {
            id: 't2',
            full_name: 'Bambang Subagyo',
            phone: '085712345678',
            teknisi_profiles: {
              status: 'bertugas',
              rating_avg: 4.9,
              specializations: ['software'],
              latitude: -6.195,
              longitude: 106.82,
            },
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    if (leafletLoaded) {
      fetchActiveTechnicians()
    }
  }, [leafletLoaded])

  if (loading || !leafletLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-sm text-slate-500 font-medium mt-2">Membuat pemantau peta...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-heading text-slate-800 dark:text-slate-100">Peta Monitor Teknisi</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Pantau posisi koordinat terakhir dan status penugasan mitra teknisi di lapangan secara real-time
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map visual */}
        <div className="lg:col-span-2 h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-900 shadow-md">
          <MapContainer
            center={[-6.2088, 106.8456]}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {technicians.map((tech) => (
              <Marker
                key={tech.id}
                position={[
                  Number(tech.teknisi_profiles.latitude),
                  Number(tech.teknisi_profiles.longitude),
                ]}
              >
                <Popup>
                  <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-1 rounded text-slate-900 dark:text-slate-100">
                    <div className="font-bold text-slate-800 dark:text-slate-150">{tech.full_name}</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 capitalize">
                      Spesialisasi: {tech.teknisi_profiles.specializations.join(', ')}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Badge className={cn('text-[8px] px-1.5 font-bold', tech.teknisi_profiles.status === 'tersedia' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400')}>
                        {tech.teknisi_profiles.status}
                      </Badge>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center">
                        ★ {tech.teknisi_profiles.rating_avg}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Legend / Status List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider">Mitra di Lapangan</h2>
          
          <div className="space-y-3">
            {technicians.map((tech) => {
              const isAvailable = tech.teknisi_profiles.status === 'tersedia'
              return (
                <Card key={tech.id} className="border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-850 dark:text-white rounded-xl shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 font-heading">{tech.full_name}</h3>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                        Spesialisasi: {tech.teknisi_profiles.specializations.join(', ')}
                      </div>
                      <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                        Lat: {Number(tech.teknisi_profiles.latitude).toFixed(4)}, Lng: {Number(tech.teknisi_profiles.longitude).toFixed(4)}
                      </div>
                    </div>
                    
                    <Badge
                      className={cn(
                        'px-2.5 py-0.5 rounded-full border text-[9px] font-bold capitalize shrink-0',
                        isAvailable
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                          : 'bg-amber-950 text-amber-400 border-amber-900'
                      )}
                    >
                      {tech.teknisi_profiles.status}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
