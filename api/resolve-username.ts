import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const username = String(req.query.username ?? '').trim()
  if (!username) {
    return res.status(400).json({ error: 'username is required' })
  }

  try {
    const pageRes = await fetch(`https://polymarket.com/@${encodeURIComponent(username)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!pageRes.ok) {
      return res.status(404).json({ error: `User "@${username}" not found` })
    }

    const html = await pageRes.text()
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) {
      return res.status(500).json({ error: 'Could not parse Polymarket page' })
    }

    const nextData = JSON.parse(match[1])
    const pageProps = nextData?.props?.pageProps ?? {}
    const proxyAddress: string | undefined =
      pageProps.proxyAddress ?? pageProps.baseAddress ?? pageProps.primaryAddress
    const resolvedUsername: string | undefined = pageProps.username
    const isAnon: boolean = pageProps.isAnon ?? false

    if (!proxyAddress || isAnon) {
      return res.status(404).json({ error: `User "@${username}" not found or is anonymous` })
    }

    return res.status(200).json({ address: proxyAddress, username: resolvedUsername ?? username })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
