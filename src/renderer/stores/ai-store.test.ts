import { describe, it, expect, beforeEach } from 'vitest'
import { useAIStore, DEFAULT_AI_CONFIG } from './ai-store'
import {
  extractCommandPlaceholders,
  replaceCommandPlaceholders
} from '../components/common/ParametricCommandModal'

describe('AI Store', () => {
  beforeEach(() => {
    useAIStore.setState({
      config: DEFAULT_AI_CONFIG,
      history: []
    })
  })

  it('should initialize with default config', () => {
    const config = useAIStore.getState().config
    expect(config.provider).toBe('gemini')
    expect(config.model).toBe('gemini-2.5-flash')
    expect(config.temperature).toBe(0.2)
  })

  it('should update config correctly', () => {
    useAIStore.getState().setConfig({
      provider: 'ollama',
      model: 'qwen2.5-coder',
      baseUrl: 'http://localhost:11434'
    })
    const config = useAIStore.getState().config
    expect(config.provider).toBe('ollama')
    expect(config.model).toBe('qwen2.5-coder')
    expect(config.baseUrl).toBe('http://localhost:11434')
  })

  it('should manage suggestion history correctly', () => {
    const s1 = useAIStore.getState().addSuggestion({
      prompt: 'Tìm file lớn hơn 50MB',
      command: 'find . -size +50M',
      explanation: 'Tìm file theo dung lượng',
      shell: 'wsl'
    })

    expect(useAIStore.getState().history).toHaveLength(1)
    expect(useAIStore.getState().history[0].prompt).toBe('Tìm file lớn hơn 50MB')

    useAIStore.getState().removeSuggestion(s1.id)
    expect(useAIStore.getState().history).toHaveLength(0)
  })
})

describe('Parametric Placeholders Parser', () => {
  it('should extract simple curly placeholders', () => {
    const cmd = 'docker run -p {{PORT}}:80 {{IMAGE_NAME}}'
    const placeholders = extractCommandPlaceholders(cmd)
    expect(placeholders).toHaveLength(2)
    expect(placeholders[0].key).toBe('PORT')
    expect(placeholders[0].defaultValue).toBeUndefined()
    expect(placeholders[1].key).toBe('IMAGE_NAME')
  })

  it('should extract placeholders with default values', () => {
    const cmd = 'git checkout -b feature/{{BRANCH_NAME:-new-task}} && npm run {{SCRIPT:-dev}}'
    const placeholders = extractCommandPlaceholders(cmd)
    expect(placeholders).toHaveLength(2)
    expect(placeholders[0].key).toBe('BRANCH_NAME')
    expect(placeholders[0].defaultValue).toBe('new-task')
    expect(placeholders[1].key).toBe('SCRIPT')
    expect(placeholders[1].defaultValue).toBe('dev')
  })

  it('should replace placeholders with user values and fallback to defaults', () => {
    const cmd = 'docker run -d -p {{HOST_PORT:-8080}}:{{CONTAINER_PORT:-80}} {{IMAGE}}'
    const res = replaceCommandPlaceholders(cmd, {
      HOST_PORT: '3000',
      IMAGE: 'nginx:alpine'
    })
    expect(res).toBe('docker run -d -p 3000:80 nginx:alpine')
  })
})
