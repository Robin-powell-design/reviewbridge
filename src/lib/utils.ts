export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function generateId(): string {
  return 'rv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6)
}

export function convertToEmbedUrl(url: string, type: string): string {
  if (!url) return ''
  if (type === 'figma' && url.includes('figma.com')) {
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
  }
  return url
}

export function getVibeEmoji(score: number): string {
  if (score >= 9) return '\u{1F60D}'
  if (score >= 7.5) return '\u{1F929}'
  if (score >= 6) return '\u{1F60A}'
  if (score >= 4.5) return '\u{1F642}'
  if (score >= 3) return '\u{1F615}'
  return '\u{1F610}'
}

export function getVibeColor(score: number): string {
  if (score >= 7) return 'var(--green)'
  if (score >= 5) return 'var(--yellow)'
  return 'var(--red)'
}

export function convertLoomToEmbed(url: string): string {
  if (!url) return ''
  // Convert loom.com/share/xxx to loom.com/embed/xxx
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://www.loom.com/embed/${match[1]}`
  }
  return url
}
