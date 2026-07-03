import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const META_PATH = path.join(ROOT, 'data', 'M-B', 'meta', 'pikalytics-mb.json')
const SCRIPT = path.join(ROOT, 'scripts', 'fetch_meta_teams.py')

function readMetaJson() {
  if (!existsSync(META_PATH)) {
    return JSON.stringify({ error: 'No meta data yet. Run scrape first.', teams: [] })
  }
  return readFileSync(META_PATH, 'utf-8')
}

function runScraper() {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', [SCRIPT], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(stderr || stdout || `exit ${code}`))
    })
  })
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

/** Dev-only API: GET /api/meta, POST /api/meta/refresh */
export function metaApiPlugin() {
  return {
    name: 'meta-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/meta' && req.method === 'GET') {
          sendJson(res, 200, readMetaJson())
          return
        }
        if (url === '/api/meta/refresh' && req.method === 'POST') {
          try {
            const result = await runScraper()
            sendJson(res, 200, readMetaJson())
            if (result.stdout) console.log('[meta-api]', result.stdout.trim())
          } catch (err) {
            sendJson(res, 500, { error: String(err.message || err) })
          }
          return
        }
        next()
      })
    },
  }
}
