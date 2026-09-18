import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// Custom dev middleware to simulate Vercel /api/parse-receipt serverless function locally
function devApiMiddleware() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/parse-receipt' && req.method === 'POST') {
          // Load env variables into process.env for local development
          const env = loadEnv('development', process.cwd(), '')
          Object.assign(process.env, env)

          let rawBody = ''
          req.on('data', (chunk) => {
            rawBody += chunk
          })

          req.on('end', async () => {
            try {
              const body = JSON.parse(rawBody || '{}')
              const fakeReq = { method: req.method, body }
              const fakeRes = {
                statusCode: 200,
                status(code) {
                  this.statusCode = code
                  return this
                },
                json(data) {
                  res.statusCode = this.statusCode
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                },
              }

              const handlerModule = await import('./api/parse-receipt.js')
              await handlerModule.default(fakeReq, fakeRes)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }))
            }
          })
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    devApiMiddleware(),
  ],
})
