import dns from 'dns'
import https from 'https'
import http from 'http'
import tls from 'tls'
import net from 'net'
import { exec } from 'child_process'
import type { PingResult, HTTPCheckResult, SSLCheckResult, DNSLookupResult } from '../../shared/types'

export class NetworkService {
  /**
   * Đo Ping Latency thời gian thực
   */
  public async ping(host: string): Promise<PingResult> {
    const cleanHost = host.trim().replace(/\(.*?\)/g, '').replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim()
    if (!cleanHost) return { host, timeMs: 0, status: 'error', error: 'Địa chỉ Host không hợp lệ' }

    return new Promise((resolve) => {
      const isWin = process.platform === 'win32'
      const cmd = isWin ? `ping -n 1 -w 3000 ${cleanHost}` : `ping -c 1 -W 3 ${cleanHost}`
      const start = Date.now()

      exec(cmd, { timeout: 4000 }, (error, stdout) => {
        if (error || !stdout) {
          // Fallback to TCP ping on port 80/443 if ICMP is blocked
          this.tcpPing(cleanHost, 80)
            .then((res) => resolve(res))
            .catch(() => resolve({ host: cleanHost, timeMs: 0, status: 'timeout', error: 'Hết thời gian chờ (Timeout)' }))
          return
        }

        // Parse Windows ping output: "time=24ms" or "time<1ms"
        const match = stdout.match(/time[=<](\d+)ms/i) || stdout.match(/time=(\d+\.?\d*)\s?ms/i)
        const ipMatch = stdout.match(/\[?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]?/)

        if (match) {
          const timeMs = parseInt(match[1], 10)
          resolve({
            host: cleanHost,
            ip: ipMatch ? ipMatch[1] : undefined,
            timeMs: isNaN(timeMs) ? Date.now() - start : timeMs,
            status: 'success'
          })
        } else {
          resolve({
            host: cleanHost,
            ip: ipMatch ? ipMatch[1] : undefined,
            timeMs: Date.now() - start,
            status: 'success'
          })
        }
      })
    })
  }

  private tcpPing(host: string, port = 80): Promise<PingResult> {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const socket = new net.Socket()
      socket.setTimeout(3000)

      socket.on('connect', () => {
        const timeMs = Date.now() - start
        socket.destroy()
        resolve({ host, timeMs, status: 'success' })
      })

      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error('Timeout'))
      })

      socket.on('error', (err) => {
        socket.destroy()
        reject(err)
      })

      socket.connect(port, host)
    })
  }

  /**
   * Kiểm tra mã phản hồi HTTP/HTTPS & Thời gian đáp ứng
   */
  public async httpCheck(targetUrl: string): Promise<HTTPCheckResult> {
    let finalUrl = targetUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }

    return new Promise((resolve) => {
      const start = Date.now()
      try {
        const parsed = new URL(finalUrl)
        const client = parsed.protocol === 'https:' ? https : http

        const req = client.get(
          finalUrl,
          { timeout: 8000, headers: { 'User-Agent': 'CLIM-Diagnostics/1.4' } },
          (res) => {
            const timeMs = Date.now() - start
            const statusCode = res.statusCode || 0
            const statusText = res.statusMessage || ''
            const success = statusCode >= 200 && statusCode < 400

            res.resume() // Consume stream to free memory
            resolve({
              url: finalUrl,
              statusCode,
              statusText,
              timeMs,
              success
            })
          }
        )

        req.on('error', (err) => {
          resolve({
            url: finalUrl,
            timeMs: Date.now() - start,
            success: false,
            error: err.message
          })
        })

        req.on('timeout', () => {
          req.destroy()
          resolve({
            url: finalUrl,
            timeMs: 8000,
            success: false,
            error: 'Request Timeout (8000ms)'
          })
        })
      } catch (e: any) {
        resolve({
          url: finalUrl,
          timeMs: 0,
          success: false,
          error: e.message
        })
      }
    })
  }

  /**
   * Kiểm tra hạn dùng Chứng Chỉ SSL / TLS
   */
  public async sslCheck(host: string, port = 443): Promise<SSLCheckResult> {
    const cleanHost = host.trim().replace(/\(.*?\)/g, '').replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim()
    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: cleanHost,
          port,
          servername: cleanHost,
          rejectUnauthorized: false,
          timeout: 6000
        },
        () => {
          try {
            const cert = socket.getPeerCertificate()
            const tlsVersion = socket.getProtocol() || undefined

            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy()
              resolve({ host: cleanHost, port, valid: false, error: 'Không tìm thấy chứng chỉ SSL' })
              return
            }

            const validFrom = cert.valid_from
            const validTo = cert.valid_to
            const expiryDate = new Date(validTo).getTime()
            const daysRemaining = Math.floor((expiryDate - Date.now()) / (1000 * 60 * 60 * 24))
            const valid = daysRemaining > 0

            const issuer = typeof cert.issuer === 'object' && cert.issuer ? String((cert.issuer as any).O || (cert.issuer as any).CN || 'Unknown') : String(cert.issuer || 'Unknown')
            const subject = typeof cert.subject === 'object' && cert.subject ? String((cert.subject as any).CN || (cert.subject as any).O || cleanHost) : String(cert.subject || cleanHost)

            socket.destroy()
            resolve({
              host: cleanHost,
              port,
              valid,
              validFrom,
              validTo,
              daysRemaining,
              issuer,
              subject,
              tlsVersion
            })
          } catch (err: any) {
            socket.destroy()
            resolve({ host: cleanHost, port, valid: false, error: err.message })
          }
        }
      )

      socket.on('error', (err) => {
        socket.destroy()
        resolve({ host: cleanHost, port, valid: false, error: err.message })
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve({ host: cleanHost, port, valid: false, error: 'Kết nối SSL quá thời gian (Timeout)' })
      })
    })
  }

  /**
   * Tra cứu bản ghi DNS
   */
  public async dnsLookup(
    domain: string,
    recordType: 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' = 'A'
  ): Promise<DNSLookupResult> {
    const cleanDomain = domain.trim().replace(/\(.*?\)/g, '').replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim()
    const start = Date.now()

    return new Promise((resolve) => {
      const resolver = dns.promises

      let queryPromise: Promise<any>
      switch (recordType) {
        case 'AAAA':
          queryPromise = resolver.resolve6(cleanDomain)
          break
        case 'MX':
          queryPromise = resolver.resolveMx(cleanDomain).then((res) => res.map((r) => `${r.priority} ${r.exchange}`))
          break
        case 'TXT':
          queryPromise = resolver.resolveTxt(cleanDomain).then((res) => res.map((r) => r.join(' ')))
          break
        case 'CNAME':
          queryPromise = resolver.resolveCname(cleanDomain)
          break
        case 'A':
        default:
          queryPromise = resolver.resolve4(cleanDomain)
          break
      }

      queryPromise
        .then((records) => {
          resolve({
            domain: cleanDomain,
            recordType,
            records: Array.isArray(records) ? records : [String(records)],
            timeMs: Date.now() - start
          })
        })
        .catch((err) => {
          resolve({
            domain: cleanDomain,
            recordType,
            records: [],
            timeMs: Date.now() - start,
            error: err.code || err.message
          })
        })
    })
  }
}

export const networkService = new NetworkService()
