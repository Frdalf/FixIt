import { create } from 'zustand'
import { Service } from '@/types'

interface CheckoutState {
  selectedServices: Service[]
  deviceName: string
  deviceType: 'laptop' | 'pc'
  locationAddress: string
  locationLat: number | null
  locationLng: number | null
  locationNotes: string
  locationPhoto: string | null
  orderNotes: string
  adminFee: number
  
  // Actions
  addService: (service: Service) => void
  removeService: (serviceId: string) => void
  toggleService: (service: Service) => void
  clearCart: () => void
  setDevice: (name: string, type: 'laptop' | 'pc') => void
  setLocation: (address: string, lat: number | null, lng: number | null, notes?: string, photo?: string | null) => void
  setOrderNotes: (notes: string) => void
  
  // Getters
  getSubtotal: () => number
  getTotal: () => number
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  selectedServices: [],
  deviceName: '',
  deviceType: 'laptop',
  locationAddress: '',
  locationLat: null,
  locationLng: null,
  locationNotes: '',
  locationPhoto: null,
  orderNotes: '',
  adminFee: 10000,

  addService: (service) => {
    const { selectedServices } = get()
    if (!selectedServices.some(s => s.id === service.id)) {
      set({ selectedServices: [...selectedServices, service] })
    }
  },

  removeService: (serviceId) => {
    const { selectedServices } = get()
    set({ selectedServices: selectedServices.filter(s => s.id !== serviceId) })
  },

  toggleService: (service) => {
    const { selectedServices } = get()
    const exists = selectedServices.some(s => s.id === service.id)
    if (exists) {
      set({ selectedServices: selectedServices.filter(s => s.id !== service.id) })
    } else {
      set({ selectedServices: [...selectedServices, service] })
    }
  },

  clearCart: () => {
    set({
      selectedServices: [],
      deviceName: '',
      deviceType: 'laptop',
      locationAddress: '',
      locationLat: null,
      locationLng: null,
      locationNotes: '',
      locationPhoto: null,
      orderNotes: '',
    })
  },

  setDevice: (name, type) => {
    set({ deviceName: name, deviceType: type })
  },

  setLocation: (address, lat, lng, notes = '', photo = null) => {
    set({
      locationAddress: address,
      locationLat: lat,
      locationLng: lng,
      locationNotes: notes,
      locationPhoto: photo,
    })
  },

  setOrderNotes: (notes) => {
    set({ orderNotes: notes })
  },

  getSubtotal: () => {
    const { selectedServices } = get()
    // Using price_min as the baseline price for checkout/orders
    return selectedServices.reduce((sum, s) => sum + s.price_min, 0)
  },

  getTotal: () => {
    const { adminFee } = get()
    return get().getSubtotal() + adminFee
  }
}))
