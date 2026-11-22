#!/usr/bin/env node
// Servidor estático para el panel asdd_tools, equivalente a
//   python3 -m http.server <puerto>
// pero en Node (sin dependencias: sólo módulos nativos).
//
// Sirve la RAÍZ del repo, porque el panel referencia rutas absolutas
// (/asdd_tools/...), igual que el Alias de Apache del proyecto original.
//
// Uso:
//   node scripts/serve-panel.mjs [puerto]        (por defecto 8777)
//   PORT=9000 node scripts/serve-panel.mjs
//   node scripts/serve-panel.mjs --no-open       (no abrir el navegador)

import http from 'node:http'
import { createReadStream, writeFileSync, unlinkSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, normalize, extname } from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'))
const PANEL = '/asdd_tools/index.html'
const args = process.argv.slice(2)
const noOpen = args.includes('--no-open')
const port = Number(args.find(a => /^\d+$/.test(a)) || process.env.PORT || 8777)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (pathname === '/') {
      res.writeHead(302, { Location: PANEL })
      return res.end()
    }
    // Resolver dentro de ROOT; rechazar cualquier escape de la raíz.
    const filePath = normalize(join(ROOT, pathname))
    if (filePath !== ROOT && !filePath.startsWith(ROOT + '/')) {
      res.writeHead(403); return res.end('403 Forbidden')
    }
    const info = await stat(filePath)
    const target = info.isDirectory() ? join(filePath, 'index.html') : filePath
    const t = await stat(target)
    res.writeHead(200, {
      'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': t.size,
      'Cache-Control': 'no-store',
    })
    createReadStream(target).pipe(res)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404 Not Found')
  }
})

// Record where the panel is being served so the Claude Code plugin can open
// it from here (it cannot probe the server itself). Runtime state, not versioned.
const urlFile = join(ROOT, 'asdd_tools', '.panel-url')
function removeUrlFile() { try { unlinkSync(urlFile) } catch { /* already gone */ } }
process.on('SIGINT',  () => { removeUrlFile(); process.exit(0) })
process.on('SIGTERM', () => { removeUrlFile(); process.exit(0) })
process.on('exit', removeUrlFile)

server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}${PANEL}`
  try {
    writeFileSync(urlFile, JSON.stringify({ url, port, ts: Date.now() }, null, 2))
  } catch { /* non-fatal: the plugin falls back to its default/config */ }
  console.log(`Panel ASDD servido en  ${url}`)
  console.log(`Raíz: ${ROOT}`)
  console.log('Ctrl+C para detener.')
  if (!noOpen) {
    const opener = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'cmd' : 'xdg-open'
    const oArgs = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
    try { spawn(opener, oArgs, { stdio: 'ignore', detached: true }).unref() } catch { /* sin navegador */ }
  }
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`El puerto ${port} ya está en uso. Prueba otro: node scripts/serve-panel.mjs 8899`)
  } else {
    console.error(e.message)
  }
  process.exit(1)
})
