export interface SubspleaseResponse {
  [key: string]: {
    time: string
    release_date: string
    show: string
    episode: string
    downloads: {
      res: string
      magnet: string
    }[]
  }
}

