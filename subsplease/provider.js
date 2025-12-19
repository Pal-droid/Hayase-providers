class AbstractSource {
  single (options) {
    throw new Error('Source doesn\'t implement single')
  }

  batch (options) {
    throw new Error('Source doesn\'t implement batch')
  }

  movie (options) {
    throw new Error('Source doesn\'t implement movie')
  }

  test () {
    throw new Error('Source doesn\'t implement test')
  }
}

// 2. YOUR SUBSPLEASE IMPLEMENTATION
export default new class Subsplease extends AbstractSource {
  /**
   * @type {import('./index.js').SearchFunction}
   */
  async single (query) {
    const searchTerm = query.titles[0]
    // Subsplease API endpoint
    const url = `https://subsplease.org/api/?f=search&tz=Europe/Rome&s=${encodeURIComponent(searchTerm)}`

    const res = await fetch(url)
    const data = await res.json()

    // Flatten the odd JSON structure (Key = Filename) into an array
    const results = Object.values(data).flatMap(item => {
      return item.downloads.map(download => {
        const magnet = download.magnet
        
        // Extract Hash (Base32)
        const hashMatch = magnet.match(/xt=urn:btih:([a-zA-Z0-9]+)/)
        let hash = hashMatch ? hashMatch[1] : ''

        // OPTIONAL: Convert Base32 hash to Hex if your client requires it.
        // For now, we return the raw hash found in the magnet.

        // Extract Size (bytes) from 'xl' param in magnet
        const sizeMatch = magnet.match(/xl=([0-9]+)/)
        const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0

        // Extract Title or build a fallback
        const dnMatch = magnet.match(/dn=([^&]+)/)
        const title = dnMatch 
          ? decodeURIComponent(dnMatch[1]) 
          : `${item.show} - ${item.episode} (${download.res})`

        return {
          title: title,
          link: magnet,
          seeders: 0, // API doesn't provide seeders
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

    // Filter by resolution if requested
    if (query.resolution) {
      return results.filter(r => r.resolution === query.resolution)
    }

    return results
  }

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
