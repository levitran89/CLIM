import type { AIConfig, AISuggestion } from '@/stores/ai-store'

export interface AICliResponse {
  command: string
  explanation: string
  isDangerous?: boolean
}

export interface AIErrorFixResponse {
  rootCause: string
  fixCommand: string
  explanation: string
}

const SYSTEM_CLI_PROMPT = `You are CLIM AI Copilot, expert in Windows PowerShell, CMD, and WSL Linux. Translate the user request into the exact optimal CLI command.
Output strictly JSON without any markdown wrapping:
{
  "command": "exact command",
  "explanation": "concise explanation",
  "isDangerous": false
}`

const SYSTEM_FIX_PROMPT = `You are CLIM AI Fast Terminal Auto-Fixer.
Your ONLY job is to diagnose the error and provide the exact shell command to fix it.

CRITICAL INSTRUCTIONS:
1. "fixCommand" MUST be the exact, runnable single-line shell command (e.g. "npm run dev", "git checkout main", "pip install requests").
2. "rootCause" must explain the issue concisely in Vietnamese (e.g. "Lệnh 'npm rum dev' bị sai chính tả từ khóa 'rum' thay vì 'run'").
3. "explanation" must explain how to fix it in Vietnamese.
4. Output MUST be ONLY valid JSON matching this exact structure with "fixCommand" FIRST:
{
  "fixCommand": "exact shell command",
  "rootCause": "nguyên nhân lỗi",
  "explanation": "hướng dẫn khắc phục"
}`

function cleanCommandString(cmd: string): string {
  if (!cmd) return ''
  let c = cmd.trim()
  // If cmd starts with markdown or quotes, strip them
  c = c.replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '')
  c = c.replace(/^["'`]|["'`]$/g, '').trim()

  // If c looks like JSON snippet, extract inner fixCommand
  if (c.includes('"fixCommand"')) {
    const m = c.match(/"fixCommand"\s*:\s*"([^"]+)"/i)
    if (m && m[1]) return m[1].trim()
  }
  if (c.startsWith('{') || c.startsWith('[')) {
    return ''
  }
  return c
}

function extractAndParseJson<T>(raw: string, fallback: T): T {
  if (!raw || !raw.trim()) return fallback

  let text = raw.trim()

  // 1. Try direct parse
  try {
    return JSON.parse(text)
  } catch {}

  // 2. Extract markdown block ```json ... ``` or ``` ... ```
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (mdMatch && mdMatch[1]) {
    try {
      return JSON.parse(mdMatch[1].trim())
    } catch {}
    text = mdMatch[1].trim()
  }

  // 3. Extract the first outer {...} object
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSubstring = text.slice(start, end + 1)
    try {
      return JSON.parse(jsonSubstring)
    } catch {}

    // Clean common JSON issues: trailing commas before } or ]
    try {
      const fixed = jsonSubstring.replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(fixed)
    } catch {}
  }

  return fallback
}

export async function requestAIGenerateCommand(
  prompt: string,
  shell: 'powershell' | 'cmd' | 'wsl',
  config: AIConfig,
  currentCwd?: string,
  activeProfileName?: string
): Promise<AICliResponse> {
  const userPrompt = `Target Shell: ${shell.toUpperCase()}
${currentCwd ? `CWD: ${currentCwd}` : ''}
${activeProfileName ? `Env: ${activeProfileName}` : ''}
Request: ${prompt}

Output JSON:`

  const rawText = await sendAiRequest(SYSTEM_CLI_PROMPT, userPrompt, config)
  const parsed = extractAndParseJson<Partial<AICliResponse>>(rawText, {})

  if (parsed.command) {
    return {
      command: parsed.command.trim(),
      explanation: parsed.explanation || 'Không có giải thích chi tiết.',
      isDangerous: Boolean(parsed.isDangerous)
    }
  }

  // Fallback
  return {
    command: rawText.replace(/```(?:json|bash|sh|powershell|cmd)?/gi, '').replace(/```/g, '').trim(),
    explanation: 'Câu lệnh được tạo bởi AI Copilot.',
    isDangerous: /rm\s+-rf|del\s+\/f|Format-Volume|Stop-Computer|fdisk/i.test(rawText)
  }
}

export async function requestAIErrorFix(
  errorMessage: string,
  lastCommand: string,
  shell: 'powershell' | 'cmd' | 'wsl',
  config: AIConfig
): Promise<AIErrorFixResponse> {
  const userPrompt = `Target Shell: ${shell.toUpperCase()}
Failed Command: ${lastCommand}
Error Log:
${errorMessage.slice(-800)}

Output JSON with "fixCommand" first:`

  const rawText = await sendAiRequest(SYSTEM_FIX_PROMPT, userPrompt, config)
  const parsed = extractAndParseJson<Partial<AIErrorFixResponse>>(rawText, {})

  let fixCommand = cleanCommandString(parsed.fixCommand || '')
  let rootCause = (parsed.rootCause || '').trim()
  let explanation = (parsed.explanation || '').trim()

  // Regex fallback if JSON had issues
  if (!fixCommand) {
    const fixMatch = rawText.match(/"fixCommand"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) ||
                     rawText.match(/"fixCommand"\s*:\s*`([^`]+)`/i)
    if (fixMatch && fixMatch[1]) {
      fixCommand = cleanCommandString(fixMatch[1])
    }
  }

  if (!rootCause) {
    const rootMatch = rawText.match(/"rootCause"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)
    if (rootMatch && rootMatch[1]) {
      rootCause = rootMatch[1].trim()
    }
  }

  if (!explanation) {
    const expMatch = rawText.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)
    if (expMatch && expMatch[1]) {
      explanation = expMatch[1].trim()
    }
  }

  // Common quick-fix heuristic if fixCommand is still missing or malformed:
  if (!fixCommand) {
    if (/\bnpm\s+rum\b/i.test(lastCommand)) {
      fixCommand = lastCommand.replace(/\bnpm\s+rum\b/i, 'npm run')
      rootCause = rootCause || `Lệnh '${lastCommand}' bị sai chính tả từ khóa 'rum' thay vì 'run'.`
    } else {
      fixCommand = lastCommand
      rootCause = rootCause || 'Phát hiện sự cố trong quá trình thực thi lệnh.'
    }
  }

  return {
    fixCommand: fixCommand || lastCommand,
    rootCause: rootCause || 'Phát hiện sự cố trong quá trình thực thi lệnh.',
    explanation: explanation || 'Chạy câu lệnh đề xuất để tiếp tục.'
  }
}

export async function testAIConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  try {
    const res = await sendAiRequest(
      'You are a helpful assistant.',
      'Respond with only the single word "OK" if you can read this.',
      config
    )
    if (res && res.length > 0) {
      return { success: true, message: `Kết nối thành công tới ${config.provider} (${config.model})!` }
    }
    return { success: false, message: 'Phản hồi từ AI rỗng.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Không thể kết nối tới nhà cung cấp AI.' }
  }
}

async function sendAiRequest(systemPrompt: string, userPrompt: string, config: AIConfig): Promise<string> {
  const { provider, apiKey, model, baseUrl, temperature } = config

  if (provider === 'gemini') {
    const cleanKey = (apiKey || '').trim()
    if (!cleanKey) throw new Error('Vui lòng nhập Google Gemini API Key trong Cài đặt.')
    const cleanModel = (model || 'gemini-2.5-flash').trim().replace(/^models\//, '')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: temperature ?? 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `Lỗi Gemini API (${res.status} ${res.statusText})`)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Không nhận được nội dung từ Google Gemini.')
    return text
  }

  if (provider === 'openai' || provider === 'custom') {
    const isCustom = provider === 'custom'
    if (!apiKey && !isCustom) throw new Error('Vui lòng nhập OpenAI API Key trong Cài đặt.')
    const endpoint = (baseUrl && baseUrl.trim())
      ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      : 'https://api.openai.com/v1/chat/completions'

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: temperature ?? 0.1,
        response_format: { type: 'json_object' }
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `Lỗi API (${res.status} ${res.statusText})`)
    }

    const data = await res.json()
    return data?.choices?.[0]?.message?.content || ''
  }

  if (provider === 'claude') {
    if (!apiKey) throw new Error('Vui lòng nhập Anthropic Claude API Key trong Cài đặt.')
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: temperature ?? 0.1
      })
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson?.error?.message || `Lỗi Claude API (${res.status} ${res.statusText})`)
    }

    const data = await res.json()
    return data?.content?.[0]?.text || ''
  }

  if (provider === 'ollama') {
    const url = `${(baseUrl || 'http://localhost:11434').replace(/\/+$/, '')}/api/chat`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: {
          temperature: temperature ?? 0.1,
          num_predict: 800
        }
      })
    })

    if (!res.ok) {
      throw new Error(`Không thể kết nối tới Ollama tại ${baseUrl || 'http://localhost:11434'}. Hãy đảm bảo Ollama đang chạy.`)
    }

    const data = await res.json()
    return data?.message?.content || ''
  }

  throw new Error(`Nhà cung cấp ${provider} không được hỗ trợ.`)
}
