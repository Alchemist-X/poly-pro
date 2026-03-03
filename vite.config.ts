import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function resolveUsernamePlugin(): Plugin {
  return {
    name: 'resolve-polymarket-username',
    configureServer(server) {
      server.middlewares.use('/api/resolve-username', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const username = url.searchParams.get('username')?.trim()
        if (!username) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'username is required' }))
          return
        }

        try {
          const pageRes = await fetch(`https://polymarket.com/@${encodeURIComponent(username)}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          })

          if (!pageRes.ok) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `User "@${username}" not found` }))
            return
          }

          const html = await pageRes.text()
          const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
          if (!match) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Could not parse Polymarket page' }))
            return
          }

          const nextData = JSON.parse(match[1])
          const pageProps = nextData?.props?.pageProps ?? {}
          const proxyAddress: string | undefined = pageProps.proxyAddress ?? pageProps.baseAddress ?? pageProps.primaryAddress
          const resolvedUsername: string | undefined = pageProps.username
          const isAnon: boolean = pageProps.isAnon ?? false

          if (!proxyAddress || isAnon) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `User "@${username}" not found or is anonymous` }))
            return
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ address: proxyAddress, username: resolvedUsername ?? username }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), resolveUsernamePlugin()],
  server: {
    proxy: {
      '/api/data': {
        target: 'https://data-api.polymarket.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/data/, ''),
      },
      '/api/gamma': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/gamma/, ''),
      },
    },
  },
})
