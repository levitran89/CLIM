import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Play,
  Square,
  Clock,
  ArrowUpRight,
  Server,
  Layers,
  Copy,
  Check,
  Zap,
  AlertTriangle,
  Radio,
  Download,
  Columns2,
  Rows3,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/stores/i18n-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { PingResult, HTTPCheckResult, SSLCheckResult, DNSLookupResult } from '@shared/types'

interface PingPoint {
  time: string
  ms: number
  status: 'success' | 'timeout' | 'error'
}

export function NetworkDiagnosticsView(): React.JSX.Element {
  const { t, language } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const columns = settings.networkColumns || 2
  const layoutWidth = settings.networkLayoutWidth || 'full'

  const toggleColumns = () => {
    updateSettings({ networkColumns: columns === 1 ? 2 : 1 })
  }

  const toggleLayoutWidth = () => {
    updateSettings({ networkLayoutWidth: layoutWidth === 'centered' ? 'full' : 'centered' })
  }

  // ─── 1. Ping State ────────────────────────────────────────────────
  const [pingHost, setPingHost] = useState('8.8.8.8')
  const [isPinging, setIsPinging] = useState(false)
  const [singlePingLoading, setSinglePingLoading] = useState(false)
  const [pingHistory, setPingHistory] = useState<PingPoint[]>([])
  const [currentPing, setCurrentPing] = useState<PingResult | null>(null)
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const doPing = async (target = pingHost, isManual = false) => {
    if (isManual) setSinglePingLoading(true)
    try {
      if (!window.api?.network?.ping) {
        toast.error(language === 'en' ? 'Network Diagnostics API not ready. Please restart the app.' : 'API Chẩn đoán mạng chưa sẵn sàng. Vui lòng khởi động lại app.')
        return
      }
      const res = await window.api.network.ping(target)
      setCurrentPing(res)
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

      setPingHistory((prev) => {
        const next = [...prev, { time: timeStr, ms: res.timeMs, status: res.status }]
        if (next.length > 30) next.shift()
        return next
      })

      if (isManual) {
        toast.success(`Ping ${res.host}: ${res.timeMs}ms (${res.status === 'success' ? (language === 'en' ? 'Success' : 'Thành công') : (language === 'en' ? 'Error' : 'Lỗi')})`)
      }
    } catch (e: any) {
      if (isManual) toast.error(language === 'en' ? `Ping error: ${e.message}` : `Lỗi ping: ${e.message}`)
    } finally {
      if (isManual) setSinglePingLoading(false)
    }
  }

  const toggleContinuousPing = () => {
    if (isPinging) {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      setIsPinging(false)
      toast.info(language === 'en' ? 'Stopped continuous ping measurement' : 'Đã dừng đo Ping liên tục')
    } else {
      setIsPinging(true)
      toast.success(language === 'en' ? `Started continuous ping to ${pingHost}` : `Bắt đầu đo Ping liên tục đến ${pingHost}`)
      doPing(pingHost)
      pingTimerRef.current = setInterval(() => {
        doPing(pingHost)
      }, 1500)
    }
  }

  // Auto-run initial single ping when component mounts
  useEffect(() => {
    doPing('8.8.8.8')
    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
    }
  }, [])

  // Ping stats
  const validPings = pingHistory.filter((p) => p.status === 'success').map((p) => p.ms)
  const avgPing = validPings.length > 0 ? Math.round(validPings.reduce((a, b) => a + b, 0) / validPings.length) : 0
  const maxPing = validPings.length > 0 ? Math.max(...validPings) : 0
  const minPing = validPings.length > 0 ? Math.min(...validPings) : 0

  // ─── 2. HTTP & SSL Check State ─────────────────────────────────────
  const [httpUrl, setHttpUrl] = useState('https://github.com')
  const [httpLoading, setHttpLoading] = useState(false)
  const [httpResult, setHttpResult] = useState<HTTPCheckResult | null>(null)
  const [sslResult, setSslResult] = useState<SSLCheckResult | null>(null)

  const handleRunHttpSslCheck = async () => {
    if (!httpUrl.trim()) {
      toast.error(language === 'en' ? 'Please enter a URL to check' : 'Vui lòng nhập URL cần kiểm tra')
      return
    }
    setHttpLoading(true)
    setHttpResult(null)
    setSslResult(null)
    toast.info(language === 'en' ? 'Checking HTTP endpoint & SSL certificate...' : 'Đang kiểm tra điểm cuối HTTP & Chứng chỉ SSL...')

    try {
      if (window.api?.network?.httpCheck) {
        const hRes = await window.api.network.httpCheck(httpUrl)
        setHttpResult(hRes)
      }
      if (window.api?.network?.sslCheck) {
        const sRes = await window.api.network.sslCheck(httpUrl)
        setSslResult(sRes)
      }
      toast.success(language === 'en' ? 'Endpoint check completed!' : 'Đã hoàn tất kiểm tra điểm cuối!')
    } catch (e: any) {
      toast.error(language === 'en' ? `Check error: ${e.message}` : `Lỗi kiểm tra: ${e.message}`)
    } finally {
      setHttpLoading(false)
    }
  }

  // ─── 3. DNS Lookup State ──────────────────────────────────────────
  const [dnsDomain, setDnsDomain] = useState('google.com')
  const [dnsType, setDnsType] = useState<'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME'>('A')
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsResult, setDnsResult] = useState<DNSLookupResult | null>(null)
  const [copiedDns, setCopiedDns] = useState(false)

  const handleRunDnsLookup = async () => {
    if (!dnsDomain.trim()) {
      toast.error(language === 'en' ? 'Please enter a domain name' : 'Vui lòng nhập tên miền (Domain)')
      return
    }
    setDnsLoading(true)
    toast.info(language === 'en' ? `Resolving DNS records (${dnsType}) for ${dnsDomain}...` : `Đang tra cứu bản ghi DNS (${dnsType}) cho ${dnsDomain}...`)
    try {
      if (window.api?.network?.dnsLookup) {
        const res = await window.api.network.dnsLookup(dnsDomain, dnsType)
        setDnsResult(res)
        if (res.records.length > 0) {
          toast.success(language === 'en' ? `Found ${res.records.length} ${dnsType} record(s)` : `Tìm thấy ${res.records.length} bản ghi ${dnsType}`)
        } else {
          toast.warning(language === 'en' ? `No ${dnsType} records found` : `Không tìm thấy bản ghi ${dnsType} nào`)
        }
      }
    } catch (e: any) {
      toast.error(language === 'en' ? `DNS lookup error: ${e.message}` : `Lỗi tra cứu DNS: ${e.message}`)
    } finally {
      setDnsLoading(false)
    }
  }

  const handleCopyDnsRecords = () => {
    if (!dnsResult || dnsResult.records.length === 0) return
    navigator.clipboard.writeText(dnsResult.records.join('\n'))
    setCopiedDns(true)
    setTimeout(() => setCopiedDns(false), 2000)
    toast.success(language === 'en' ? 'DNS records copied to clipboard' : 'Đã sao chép danh sách bản ghi DNS')
  }

  const handleExportDnsTxt = async () => {
    if (!dnsResult || dnsResult.records.length === 0) {
      toast.error(language === 'en' ? 'No records to export' : 'Không có bản ghi nào để xuất file')
      return
    }
    const content = [
      `========================================`,
      `CLIM Network Diagnostics - DNS Lookup`,
      `Domain: ${dnsResult.domain}`,
      `Record Type: ${dnsResult.recordType}`,
      `Response Time: ${dnsResult.timeMs}ms`,
      `Timestamp: ${new Date().toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}`,
      `========================================\n`,
      ...dnsResult.records.map((r, i) => `[${i + 1}] ${r}`)
    ].join('\n')

    try {
      if (window.api?.system?.saveFile) {
        const filePath = await window.api.system.saveFile(
          content,
          `dns_${dnsResult.domain}_${dnsResult.recordType}.txt`
        )
        if (filePath) {
          toast.success(language === 'en' ? `File saved: ${filePath.split('\\').pop() || filePath}` : `Đã lưu file: ${filePath.split('\\').pop() || filePath}`)
        }
      }
    } catch (e: any) {
      toast.error(language === 'en' ? `Export error: ${e.message}` : `Lỗi xuất file: ${e.message}`)
    }
  }

  // Simple SVG Line Chart generator
  const renderPingChart = () => {
    if (pingHistory.length < 2) {
      return (
        <div className="h-28 flex flex-col items-center justify-center text-zinc-500 text-xs font-mono gap-1">
          <Activity size={18} className="text-zinc-600 animate-pulse" />
          <span>{language === 'en' ? 'Collecting network latency samples...' : 'Đang thu thập dữ liệu độ trễ đường truyền...'}</span>
        </div>
      )
    }

    const width = 600
    const height = 110
    const padding = 12
    const maxVal = Math.max(100, ...pingHistory.map((p) => p.ms)) + 10

    const points = pingHistory
      .map((pt, idx) => {
        const x = padding + (idx / (pingHistory.length - 1)) * (width - padding * 2)
        const y = height - padding - (pt.ms / maxVal) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')

    return (
      <div className="w-full h-28 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeDasharray="3 3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeDasharray="3 3" />

          {/* Polyline */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data Points */}
          {pingHistory.map((pt, idx) => {
            const x = padding + (idx / (pingHistory.length - 1)) * (width - padding * 2)
            const y = height - padding - (pt.ms / maxVal) * (height - padding * 2)
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                className={pt.status === 'success' ? 'fill-emerald-400 stroke-zinc-950 stroke-1' : 'fill-rose-500'}
              >
                <title>{`${pt.time}: ${pt.ms}ms`}</title>
              </circle>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className={layoutWidth === 'centered' ? 'max-w-5xl mx-auto space-y-6 text-zinc-100' : 'w-full space-y-6 text-zinc-100'}>
      {/* ─── Top Control Toolbar ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            {language === 'en' ? 'Network Diagnostics & Monitoring Center' : 'Trung Tâm Chẩn Đoán & Giám Sát Mạng'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Column Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8.5 w-8.5 shrink-0 ${
              columns === 2
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            onClick={toggleColumns}
            title={columns === 2 ? (language === 'en' ? 'Switch to 1 column' : 'Chuyển sang 1 cột') : (language === 'en' ? 'Switch to 2 columns' : 'Chuyển sang 2 cột')}
          >
            {columns === 2 ? <Columns2 size={16} /> : <Rows3 size={16} />}
          </Button>

          {/* Full Width / Centered Layout Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8.5 w-8.5 shrink-0 ${
              layoutWidth === 'centered'
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            onClick={toggleLayoutWidth}
            title={layoutWidth === 'centered'
              ? (language === 'en' ? 'Switch to Full Width mode' : 'Chuyển sang chế độ Tràn viền')
              : (language === 'en' ? 'Switch to Centered Web mode' : 'Chuyển sang chế độ Dạng Web ở giữa')}
          >
            {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>

      {/* ─── 1. Real-time Ping Latency Section ────────────────────── */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                  {t('network.pingTest') || 'Real-time Ping Latency'}
                </h3>
                {isPinging && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono animate-pulse gap-1">
                    <Radio size={10} className="animate-spin text-emerald-400" />
                    {language === 'en' ? 'Live Measuring' : 'Đang đo liên tục'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'en'
                  ? 'Measure ICMP latency (ms), packet stability and jitter'
                  : 'Đo độ trễ ICMP (ms), kiểm tra jitter và độ ổn định của kết nối mạng'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={pingHost}
              onChange={(e) => setPingHost(e.target.value)}
              placeholder={language === 'en' ? '8.8.8.8 or domain' : '8.8.8.8 hoặc domain'}
              className="w-40 sm:w-48 h-8 bg-zinc-950 border-zinc-800 text-xs font-mono focus:border-emerald-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') doPing(pingHost, true)
              }}
            />

            <Button
              size="sm"
              variant="outline"
              disabled={singlePingLoading}
              onClick={() => doPing(pingHost, true)}
              className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1 cursor-pointer shrink-0"
              title={language === 'en' ? 'Ping 1 time immediately' : 'Đo ping 1 lần ngay lập tức'}
            >
              <RefreshCw size={12} className={singlePingLoading ? 'animate-spin text-emerald-400' : ''} />
              <span>{language === 'en' ? 'Ping Once' : 'Ping 1 Lần'}</span>
            </Button>

            <Button
              size="sm"
              onClick={toggleContinuousPing}
              className={`h-8 text-xs font-bold gap-1.5 cursor-pointer shrink-0 ${
                isPinging
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm'
              }`}
            >
              {isPinging ? <Square size={12} /> : <Play size={12} />}
              <span>
                {isPinging
                  ? (language === 'en' ? 'Stop Ping' : (t('network.stopPing') || 'Dừng Đo'))
                  : (language === 'en' ? 'Continuous Ping' : (t('network.startPing') || 'Đo Liên Tục'))}
              </span>
            </Button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 font-mono pt-0.5">
          <span className="text-zinc-400 font-semibold">
            {language === 'en' ? 'Presets:' : 'Mục tiêu mẫu:'}
          </span>
          {[
            { label: '8.8.8.8 (Google DNS)', val: '8.8.8.8' },
            { label: '1.1.1.1 (Cloudflare)', val: '1.1.1.1' },
            { label: 'github.com', val: 'github.com' }
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => {
                setPingHost(p.val)
                doPing(p.val, true)
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer text-[11px]"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Metrics Overview Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
              {language === 'en' ? 'Current Latency' : 'Độ Trễ Hiện Tại'}
            </span>
            <span className={`text-xl font-extrabold ${currentPing?.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentPing ? `${currentPing.timeMs}ms` : '--'}
            </span>
          </div>
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
              {language === 'en' ? 'Average Latency' : 'Độ Trễ Trung Bình'}
            </span>
            <span className="text-xl font-extrabold text-zinc-200">{avgPing ? `${avgPing}ms` : '--'}</span>
          </div>
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
              {language === 'en' ? 'Lowest (Min)' : 'Thấp Nhất (Min)'}
            </span>
            <span className="text-xl font-extrabold text-cyan-400">{minPing ? `${minPing}ms` : '--'}</span>
          </div>
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">
              {language === 'en' ? 'Peak (Max)' : 'Cao Nhất (Peak)'}
            </span>
            <span className="text-xl font-extrabold text-amber-400">{maxPing ? `${maxPing}ms` : '--'}</span>
          </div>
        </div>

        {/* Live SVG Graph */}
        <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800/80">
          {renderPingChart()}
        </div>
      </div>

      {/* ─── 2 & 3. HTTP SSL & DNS Resolvers Grid ───────────────── */}
      <div className={columns === 1 ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        {/* ─── 2. HTTP Check & SSL Expiry ─────────────────────────── */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe size={19} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                {t('network.httpCheck') || 'HTTP Endpoint & SSL Verification'}
              </h3>
              <p className="text-xs text-zinc-400">
                {language === 'en'
                  ? 'Measure HTTP response time, status code and SSL certificate validity'
                  : 'Đo thời gian phản hồi, mã HTTP và hạn chứng chỉ SSL'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 h-8 bg-zinc-950 border-zinc-800 text-xs font-mono focus:border-blue-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunHttpSslCheck()
              }}
            />
            <Button
              size="sm"
              disabled={httpLoading}
              onClick={handleRunHttpSslCheck}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw size={12} className={httpLoading ? 'animate-spin' : ''} />
              <span>{httpLoading ? (language === 'en' ? 'Checking...' : 'Đang Kiểm Tra...') : (language === 'en' ? 'Check' : 'Kiểm Tra')}</span>
            </Button>
          </div>

          {/* Results Box */}
          <div className="flex-1 min-h-[140px] flex flex-col justify-center">
            {httpLoading ? (
              <div className="p-6 bg-zinc-950/80 rounded-xl border border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <RefreshCw size={15} className="animate-spin text-blue-400" />
                <span>{language === 'en' ? 'Sending GET request and analyzing SSL certificate...' : 'Đang gửi gói tin GET và phân tích SSL certificate...'}</span>
              </div>
            ) : httpResult ? (
              <div className="space-y-2.5">
                <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">{language === 'en' ? 'HTTP Status Code:' : 'Mã Trạng Thái (Status):'}</span>
                    <Badge className={`text-[11px] ${httpResult.success ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'}`}>
                      {httpResult.statusCode} {httpResult.statusText || (httpResult.success ? 'OK' : 'Error')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">{language === 'en' ? 'Response Latency:' : 'Thời gian đáp ứng (Latency):'}</span>
                    <span className="text-emerald-400 font-bold">{httpResult.timeMs}ms</span>
                  </div>
                </div>

                {sslResult && (
                  <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">{language === 'en' ? 'SSL Certificate Expiry:' : 'Hạn Chứng Chỉ SSL:'}</span>
                      {sslResult.valid ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck size={14} /> {sslResult.daysRemaining} {language === 'en' ? 'days remaining' : 'ngày còn lại'}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <ShieldAlert size={14} /> {sslResult.error || (language === 'en' ? 'Expired / Error' : 'Hết hạn / Lỗi')}
                        </span>
                      )}
                    </div>
                    {sslResult.issuer && (
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{language === 'en' ? 'Issuer:' : 'Nhà cấp (Issuer):'}</span>
                        <span className="text-zinc-300 truncate max-w-[200px]" title={sslResult.issuer}>
                          {sslResult.issuer}
                        </span>
                      </div>
                    )}
                    {sslResult.tlsVersion && (
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{language === 'en' ? 'TLS Protocol:' : 'Giao thức mã hóa:'}</span>
                        <span className="text-purple-300">{sslResult.tlsVersion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-zinc-950/50 rounded-xl border border-zinc-850 text-center text-xs text-zinc-500">
                {language === 'en'
                  ? 'Enter a URL and click "Check" to measure response latency and SSL validity'
                  : 'Nhập URL và bấm "Kiểm Tra" để đo tốc độ phản hồi và hạn SSL'}
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. DNS Multi-Record Resolver ───────────────────────── */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server size={19} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                {t('network.dnsLookup') || 'DNS Record Resolver'}
              </h3>
              <p className="text-xs text-zinc-400">
                {language === 'en'
                  ? 'Rapidly resolve A, AAAA, MX, TXT, CNAME DNS records'
                  : 'Phân giải nhanh các bản ghi A, AAAA, MX, TXT, CNAME'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={dnsDomain}
              onChange={(e) => setDnsDomain(e.target.value)}
              placeholder="google.com"
              className="flex-1 h-8 bg-zinc-950 border-zinc-800 text-xs font-mono focus:border-purple-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunDnsLookup()
              }}
            />
            <select
              value={dnsType}
              onChange={(e: any) => setDnsType(e.target.value)}
              className="h-8 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs font-mono text-zinc-200 outline-none cursor-pointer"
            >
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="MX">MX (Mail)</option>
              <option value="TXT">TXT</option>
              <option value="CNAME">CNAME</option>
            </select>
            <Button
              size="sm"
              disabled={dnsLoading}
              onClick={handleRunDnsLookup}
              className="h-8 text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold gap-1.5 cursor-pointer shrink-0"
            >
              <Search size={12} className={dnsLoading ? 'animate-spin' : ''} />
              <span>{dnsLoading ? (language === 'en' ? 'Resolving...' : 'Đang Tra...') : (language === 'en' ? 'Resolve' : 'Tra Cứu')}</span>
            </Button>
          </div>

          {/* DNS Results Box */}
          <div className="flex-1 min-h-[140px] flex flex-col justify-center">
            {dnsLoading ? (
              <div className="p-6 bg-zinc-950/80 rounded-xl border border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <RefreshCw size={15} className="animate-spin text-purple-400" />
                <span>{language === 'en' ? 'Resolving DNS records...' : 'Đang phân giải bản ghi DNS...'}</span>
              </div>
            ) : dnsResult ? (
              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-400 font-semibold">
                    {language === 'en' ? `Resolved Records (${dnsResult.recordType}):` : `Kết quả bản ghi (${dnsResult.recordType}):`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 mr-1">{dnsResult.timeMs}ms</span>
                    {dnsResult.records.length > 0 && (
                      <>
                        <button
                          onClick={handleCopyDnsRecords}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title={language === 'en' ? 'Copy all records' : 'Sao chép toàn bộ bản ghi'}
                        >
                          {copiedDns ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={handleExportDnsTxt}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title={language === 'en' ? 'Export TXT file' : 'Xuất file TXT kết quả DNS'}
                        >
                          <Download size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {dnsResult.records.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {dnsResult.records.map((rec, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800/60 text-zinc-200 hover:text-emerald-400 flex items-center justify-between"
                      >
                        <span className="truncate">{rec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-rose-400 italic block py-1">
                    {dnsResult.error || (language === 'en' ? 'No DNS records found.' : 'Không tìm thấy bản ghi nào.')}
                  </span>
                )}
              </div>
            ) : (
              <div className="p-6 bg-zinc-950/50 rounded-xl border border-zinc-850 text-center text-xs text-zinc-500">
                {language === 'en'
                  ? 'Enter a domain and click "Resolve" to inspect resolved IP or MX/TXT records'
                  : 'Nhập tên miền và bấm "Tra Cứu" để xem danh sách IP hoặc bản ghi MX/TXT'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
