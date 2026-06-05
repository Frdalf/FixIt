'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet marker icons in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
})

interface MapPickerProps {
  initialLat?: number
  initialLng?: number
  onChange: (lat: number, lng: number, address: string) => void
}

export default function MapPicker({
  initialLat = -6.2088,
  initialLng = 106.8456,
  onChange,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng])
  const [addressLoading, setAddressLoading] = useState(false)
  const markerRef = useRef<L.Marker>(null)

  const reverseGeocode = async (lat: number, lng: number) => {
    setAddressLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id-ID,id;q=0.9',
          },
        }
      )
      const data = await res.json()
      const displayName = data.display_name || `${lat}, ${lng}`
      onChange(lat, lng, displayName)
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      onChange(lat, lng, `Titik Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } finally {
      setAddressLoading(false)
    }
  }

  // Handle map clicks
  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        reverseGeocode(lat, lng)
      },
    })
    return null
  }

  // Handle marker drag end
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const { lat, lng } = marker.getLatLng()
          setPosition([lat, lng])
          reverseGeocode(lat, lng)
        }
      },
    }),
    []
  )

  useEffect(() => {
    // Run initial geocoding on mount
    reverseGeocode(initialLat, initialLng)
  }, [])

  return (
    <div className="relative w-full h-[250px] sm:h-[300px] rounded-2xl overflow-hidden border border-slate-200">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={position}
          ref={markerRef}
        />
        <MapEvents />
      </MapContainer>
      {addressLoading && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-650 shadow-sm border border-slate-100 z-[1000] animate-pulse">
          Mencari alamat...
        </div>
      )}
    </div>
  )
}
