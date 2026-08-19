import type { TerminalRecording } from '@shared/types'

/**
 * Xuất bản ghi terminal theo định dạng tiêu chuẩn Asciinema v2 (.cast)
 */
export function exportToAsciinemaCast(recording: TerminalRecording, cols = 120, rows = 35): string {
  const header = {
    version: 2,
    width: cols,
    height: rows,
    timestamp: Math.floor(recording.startedAt / 1000),
    title: recording.title,
    env: {
      SHELL: 'powershell',
      TERM: 'xterm-256color'
    }
  }

  const lines: string[] = [JSON.stringify(header)]

  for (const ev of recording.events) {
    const timeSec = Number((ev.time / 1000).toFixed(4))
    lines.push(JSON.stringify([timeSec, 'o', ev.data]))
  }

  return lines.join('\n')
}

/**
 * Xuất bản ghi ra file HTML tự động phát (Standalone HTML Player)
 * Có thể mở trực tiếp trên mọi trình duyệt mà không cần cài đặt gì thêm!
 */
export function exportToStandaloneHtmlPlayer(recording: TerminalRecording): string {
  const castContent = exportToAsciinemaCast(recording)
  const escapedCast = JSON.stringify(castContent)

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLIM Terminal Replay - ${escapeHtml(recording.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/asciinema-player@3.7.0/dist/bundle/asciinema-player.css">
  <style>
    body {
      margin: 0;
      padding: 24px;
      background-color: #0c0c0f;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .header {
      width: 100%;
      max-width: 960px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #27272a;
      padding-bottom: 12px;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta {
      font-size: 12px;
      color: #a1a1aa;
      font-family: monospace;
    }
    #player-container {
      width: 100%;
      max-width: 960px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      border: 1px solid #3f3f46;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">⚡ CLIM Terminal Recording: ${escapeHtml(recording.title)}</div>
    <div class="meta">Thời lượng: ${(recording.durationMs / 1000).toFixed(1)}s · ${new Date(recording.startedAt).toLocaleString('vi-VN')}</div>
  </div>

  <div id="player-container"></div>

  <script src="https://cdn.jsdelivr.net/npm/asciinema-player@3.7.0/dist/bundle/asciinema-player.min.js"></script>
  <script>
    const castData = ${escapedCast};
    const blob = new Blob([castData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    AsciinemaPlayer.create(url, document.getElementById('player-container'), {
      autoPlay: true,
      loop: false,
      speed: 1,
      theme: 'monokai',
      fontSize: 'medium'
    });
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
