import { useState, useEffect } from 'react'

let _setToast = null

export function showToast(msg, type = 'error') {
  _setToast?.({ msg, type })
}

export default function ToastContainer() {
  const [toast, setToast] = useState(null)
  _setToast = setToast

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null

  const bg = toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-muschio' : 'bg-noce'

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bg} text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw] text-center`}>
      {toast.msg}
    </div>
  )
}
