import useSWR from 'swr'

const fetcher = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error('Market data is temporarily unavailable')
    error.status = response.status
    throw error
  }
  return response.json()
}

export function useMarketData() {
  const market = useSWR('/market/overview', fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: true,
    dedupingInterval: 30000,
  })
  const narratives = useSWR('/market/narratives', fetcher, {
    refreshInterval: 300000,
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  })
  return { market, narratives }
}
