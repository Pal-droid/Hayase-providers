import AbstractSource from './abstract.js'

export default new class Subsplease extends AbstractSource {
  /**
   * @type {import('./index.js').SearchFunction}
   */
  async single (query) {
    // Subsplease uses space-separated search terms
    const searchTerm = query.titles[0]
    const url = `https://subsplease.org/api/?f=search&tz=Europe/Rome&s=${encodeURIComponent(searchTerm)}`

    const res = await fetch(url)
    /** @type {import('./types.js').SubspleaseResponse} */
    const data = await res.json()

    // The API returns an Object where keys are the episode names.
    // We must map these keys to an array of results.
    const results = Object.values(data).flatMap(item => {
      return item.downloads.map(download => {
        // Parse metadata from the magnet link
        const magnet = download.magnet
        
        // 1. Extract Hash (Base32 or Hex)
        // Subsplease often uses Base32 in magnets (e.g., H6EL...) which needs to be parsed or returned as is.
        // Most clients accept Base32, but standardizing to Hex is safer if you have a helper. 
        // For this extension, we will extract the raw hash string provided in the magnet.
        const hashMatch = magnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/)
        const hash = hashMatch ? hashMatch[1] : ''

        // 2. Extract Size (xl parameter)
        // The API doesn't give size in JSON, but it is often in the magnet query params as 'xl'
        const sizeMatch = magnet.match(/xl=([0-9]+)/)
        const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0

        // 3. Extract Title (dn parameter) or construct it
        const dnMatch = magnet.match(/dn=([^&]+)/)
        const title = dnMatch ? decodeURIComponent(dnMatch[1]) : `${item.show} - ${item.episode} (${download.res})`

        return {
          title: title,
          link: magnet,
          // Subsplease doesn't provide seeders/leechers in API. 
          // We return 0 or a placeholder as Subsplease is a high-availability seedbox source.
          seeders: 0,
          leechers: 0,
          downloads: 0,
          accuracy: 'high',
          hash: hash,
          size: size,
          date: new Date(item.release_date),
          resolution: download.res
        }
      })
    })

    // Filter by resolution if requested in the query
    if (query.resolution) {
      return results.filter(r => r.resolution === query.resolution)
    }

    return results
  }

  // Subsplease search handles batches and movies via the same endpoint
  batch = this.single
  movie = this.single

  async test () {
    try {
      const res = await fetch('https://subsplease.org/api/?f=search&tz=Europe/Rome&s=test')
      return res.ok
    } catch (e) {
      return false
    }
  }
}()

