import { useRef, useState, useCallback, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { useTheme } from '../../context/ThemeContext'

interface DiagnosticMessage {
  message: string
  line: number
  col: number
  category: 'error' | 'warning' | 'suggestion'
}

interface OutputLine {
  type: 'log' | 'error' | 'warn' | 'info' | 'result'
  text: string
  timestamp: number
}

interface TypeScriptPlaygroundProps {
  initialCode?: string
  height?: number
  title?: string
  readonlyRanges?: Array<{ startLine: number; endLine: number }>
}

const DEFAULT_CODE = `// TypeScript Playground
// Edit and run code — output appears below

interface User {
  name: string
  age: number
  role: 'admin' | 'viewer'
}

function greet(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`
}

const user: User = {
  name: 'Jerry',
  age: 30,
  role: 'admin',
}

console.log(greet(user))
console.log(\`Role: \${user.role}\`)
`

export default function TypeScriptPlayground({
  initialCode = DEFAULT_CODE,
  height = 320,
  title,
}: TypeScriptPlaygroundProps) {
  const { isDark } = useTheme()
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'output' | 'types'>('output')
  const [code, setCode] = useState(initialCode)
  const outputRef = useRef<HTMLDivElement | null>(null)

  // Scroll output to bottom when new lines arrive
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      allowJs: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Editor keybinding: Ctrl/Cmd + Enter to run
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => runCode()
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runCode = useCallback(async () => {
    if (!editorRef.current || !monacoRef.current) return
    setIsRunning(true)
    setActiveTab('output')

    const currentCode = editorRef.current.getValue()
    const newOutput: OutputLine[] = []
    const ts = monacoRef.current

    // Gather Monaco diagnostics
    const model = editorRef.current.getModel()
    const diags: DiagnosticMessage[] = []
    if (model) {
      const markers = ts.editor.getModelMarkers({ resource: model.uri })
      for (const m of markers) {
        diags.push({
          message: m.message,
          line: m.startLineNumber,
          col: m.startColumn,
          category:
            m.severity === ts.MarkerSeverity.Error
              ? 'error'
              : m.severity === ts.MarkerSeverity.Warning
              ? 'warning'
              : 'suggestion',
        })
      }
    }
    setDiagnostics(diags)

    // Transpile TS → JS via Monaco's worker
    const uri = model?.uri.toString() ?? 'file:///main.ts'
    let jsCode = currentCode

try {
  const worker = await ts.languages.typescript.getTypeScriptWorker()
  const client = await worker(model!.uri)
  // Small delay to ensure worker has processed the model
  await new Promise(resolve => setTimeout(resolve, 100))
  const emitOutput = await client.getEmitOutput(uri)
  if (emitOutput.outputFiles.length > 0) {
    jsCode = emitOutput.outputFiles[0].text
  } else {
    throw new Error('No output files from TypeScript worker')
  }
} catch (e) {
  // Fallback: use Babel-style type stripping via regex (best-effort)
  jsCode = currentCode
    .replace(/^type\s+\w+\s*=\s*.+$/gm, '')           // type aliases
    .replace(/^interface\s+\w+\s*\{[^}]*\}/gms, '')    // interfaces
    .replace(/:\s*[\w<>\[\] |&]+(?=[,)=\n{;])/g, '')   // type annotations
    .replace(/<[\w,\s]+>/g, '')                          // generics
    .replace(/^\s*[\r\n]/gm, '')                         // blank lines left behind
}

    // Capture console methods
    const consoleMethods = ['log', 'error', 'warn', 'info'] as const
    type ConsoleMethod = typeof consoleMethods[number]
    const originalConsole: Record<ConsoleMethod, typeof console.log> = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    }

    consoleMethods.forEach((method) => {
      ;(console as unknown as Record<string, (...args: unknown[]) => void>)[method] = (...args: unknown[]) => {
        newOutput.push({
          type: method as OutputLine['type'],
          text: args
            .map((a) =>
              typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
            )
            .join(' '),
          timestamp: Date.now(),
        })
      }
    })

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(jsCode)
      const result = fn()
      if (result !== undefined) {
        newOutput.push({
          type: 'result',
          text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
          timestamp: Date.now(),
        })
      }
    } catch (err) {
      newOutput.push({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      })
    } finally {
      // Restore console
      consoleMethods.forEach((method) => {
        ;(console as unknown as Record<string, (...args: unknown[]) => void>)[method] = originalConsole[method]
      })
      setIsRunning(false)
    }

    if (newOutput.length === 0) {
      newOutput.push({ type: 'info', text: '(no output)', timestamp: Date.now() })
    }

    setOutput(newOutput)
  }, [])

  const clearOutput = () => setOutput([])

  const resetCode = () => {
    setCode(initialCode)
    setOutput([])
    setDiagnostics([])
    if (editorRef.current) {
      editorRef.current.setValue(initialCode)
    }
  }

  const errorCount = diagnostics.filter((d) => d.category === 'error').length
  const warnCount = diagnostics.filter((d) => d.category === 'warning').length

  return (
    <div className="ts-playground">
      <div className="ts-playground__header">
        <div className="ts-playground__title">
          <span className="ts-playground__icon">⚡</span>
          <span>{title ?? 'TypeScript Playground'}</span>
        </div>
        <div className="ts-playground__actions">
          <button
            className="ts-playground__btn ts-playground__btn--ghost"
            onClick={resetCode}
            title="Reset to initial code"
          >
            ↺ Reset
          </button>
          <button
            className={`ts-playground__btn ts-playground__btn--run${isRunning ? ' ts-playground__btn--running' : ''}`}
            onClick={runCode}
            disabled={isRunning}
            title="Run (Ctrl+Enter)"
          >
            {isRunning ? (
              <span className="ts-playground__spinner" />
            ) : (
              '▶ Run'
            )}
          </button>
        </div>
      </div>

      <div className="ts-playground__editor-wrap">
        <Editor
          height={height}
          defaultLanguage="typescript"
          defaultValue={initialCode}
          value={code}
          onChange={(val) => setCode(val ?? '')}
          onMount={handleEditorDidMount}
          theme={isDark ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>

      <div className="ts-playground__output-panel">
        <div className="ts-playground__tabs">
          <button
            className={`ts-playground__tab${activeTab === 'output' ? ' ts-playground__tab--active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
            {output.length > 0 && (
              <span className="ts-playground__badge">{output.length}</span>
            )}
          </button>
          <button
            className={`ts-playground__tab${activeTab === 'types' ? ' ts-playground__tab--active' : ''}`}
            onClick={() => setActiveTab('types')}
          >
            Diagnostics
            {errorCount > 0 && (
              <span className="ts-playground__badge ts-playground__badge--error">
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </span>
            )}
            {errorCount === 0 && warnCount > 0 && (
              <span className="ts-playground__badge ts-playground__badge--warn">
                {warnCount} warn{warnCount > 1 ? 's' : ''}
              </span>
            )}
            {errorCount === 0 && warnCount === 0 && diagnostics.length === 0 && output.length > 0 && (
              <span className="ts-playground__badge ts-playground__badge--ok">✓</span>
            )}
          </button>
          {output.length > 0 && (
            <button
              className="ts-playground__tab ts-playground__tab--clear"
              onClick={clearOutput}
            >
              Clear
            </button>
          )}
        </div>

        <div className="ts-playground__output" ref={outputRef}>
          {activeTab === 'output' && (
            <>
              {output.length === 0 ? (
                <div className="ts-playground__empty">
                  Press <kbd>▶ Run</kbd> or <kbd>Ctrl+Enter</kbd> to execute
                </div>
              ) : (
                output.map((line, i) => (
                  <div
                    key={i}
                    className={`ts-playground__line ts-playground__line--${line.type}`}
                  >
                    <span className="ts-playground__line-prefix">
                      {line.type === 'error' ? '✗' : line.type === 'warn' ? '⚠' : line.type === 'result' ? '→' : '›'}
                    </span>
                    <pre className="ts-playground__line-text">{line.text}</pre>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'types' && (
            <>
              {diagnostics.length === 0 ? (
                <div className="ts-playground__empty ts-playground__empty--ok">
                  {output.length > 0 ? '✓ No type errors' : 'Run code to check diagnostics'}
                </div>
              ) : (
                diagnostics.map((d, i) => (
                  <div
                    key={i}
                    className={`ts-playground__line ts-playground__line--${d.category}`}
                  >
                    <span className="ts-playground__line-prefix">
                      {d.category === 'error' ? '✗' : '⚠'}
                    </span>
                    <pre className="ts-playground__line-text">
                      Line {d.line}:{d.col} — {d.message}
                    </pre>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
