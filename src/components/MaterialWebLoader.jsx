import { useEffect } from 'react'

export default function MaterialWebLoader() {
  useEffect(() => {
    import('@material/web/all.js')
  }, [])
  return null
}
