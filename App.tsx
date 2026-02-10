
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import { analyzeCode, checkBackendStatus } from './services/apiService';
import { CodeReviewResult, IssueSeverity } from './types';
import MetricCard from './components/MetricCard';
import CodeComparison from './components/CodeComparison';
import IssuesPanel from './components/IssuesPanel';
import LogTerminal from './components/LogTerminal';
import EmptyPlaceholder from './components/EmptyPlaceholder';

const SAMPLES = {
  'Memory Leak (JS)': 'let cache = [];\nfunction processData(data) {\n  cache.push(data);\n  return data.toUpperCase();\n}\nsetInterval(() => processData("data"), 100);',
  'SQL Injection (Py)': 'import sqlite3\ndef get_user(user_id):\n  conn = sqlite3.connect("db.sqlite")\n  query = f"SELECT * FROM users WHERE id = \'{user_id}\'\"\n  conn.cursor().execute(query)\n  return cursor.fetchone()',
  'Inefficient Loop (TS)': 'function findDuplicates(arr: number[]) {\n  const dups = [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j] && !dups.includes(arr[i])) dups.push(arr[i]);\n    }\n  }\n  return dups;\n}'
};

const SUPPORTED_LANGUAGES = [
  'Auto-detect',
  'C++',
  'Java',
  'C',
  'Python'
];

const App: React.FC = () => {
  const [code, setCode] = useState<string>('// Senior Developer optimized snippet...\nasync function fetchUserData(id: string) {\n  const user = await db.users.findUnique({ where: { id } });\n  if (!user) throw new Error("404");\n  return user;\n}');
  const [language, setLanguage] = useState<string>('Auto-detect');
  const [provider] = useState<string>('gemini');
  const [mode, setMode] = useState<'mentor' | 'strict' | 'debugger' | 'performance' | 'tester'>('strict');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info'|'warn'|'err'}[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((msg: string, type: 'info'|'warn'|'err' = 'info') => {
    setLogs(prev => [...prev.slice(-24), { msg, type }]);
  }, []);

  useEffect(() => {
    const init = async () => {
      const online = await checkBackendStatus();
      setIsBackendOnline(online);
      addLog("Engine v1.2.0 initialized.");
    };
    init();
  }, [addLog]);

  const handleAnalyze = async (isAlternative: boolean = false) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    addLog(`${isAlternative ? 'Regenerating alternative' : 'Initiating'} ${mode} analysis for ${language}...`);
    
    try {
      const data = await analyzeCode(code, language, provider, mode, isAlternative);
      setResult(data);
      addLog(`Analysis complete: ${data.issues.length} findings.`, 'info');
    } catch (err: any) {
      setError(err.message);
      addLog(`Error: ${err.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const lines = useMemo(() => code.split('\n'), [code]);

  const navActions = (
    <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] px-4 py-2 rounded-xl">
      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Target Language</span>
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-[var(--primary)] text-xs font-bold outline-none cursor-pointer hover:opacity-80 transition-opacity min-w-[100px]"
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang} value={lang} className="bg-[var(--surface)] text-[var(--text-main)]">{lang}</option>
        ))}
      </select>
    </div>
  );

  return (
    <Layout navActions={navActions}>
      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => { setCode(ev.target?.result as string); setResult(null); };
          reader.readAsText(file);
        }
      }} className="hidden" />

      <div className="mb-10 flex flex-wrap items-center justify-between gap-6 bg-[var(--surface)] p-5 rounded-[32px] border border-[var(--border)] shadow-2xl backdrop-blur-3xl">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4 bg-[var(--bg)] px-5 py-3 rounded-2xl border border-[var(--border)]">
            <div className={`w-3 h-3 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`}></div>
            <span className="text-[11px] font-bold">{isBackendOnline ? 'Hybrid Bridge' : 'Cloud Native'}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Snippet Library</label>
            <select 
              onChange={(e) => { setCode(SAMPLES[e.target.value as keyof typeof SAMPLES]); setResult(null); }}
              defaultValue=""
              className="bg-[var(--bg)] border border-[var(--border)] text-[var(--primary)] text-xs font-bold rounded-xl px-5 py-2.5 appearance-none min-w-[160px] focus:ring-2 focus:ring-[var(--primary)]/30 outline-none cursor-pointer"
            >
              <option value="" disabled>Load Sample...</option>
              {Object.keys(SAMPLES).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Persona</label>
            <div className="flex gap-1 bg-[var(--bg)] p-1 rounded-2xl border border-[var(--border)]">
              {['strict', 'mentor', 'debugger', 'performance'].map(p => (
                <button key={p} onClick={() => setMode(p as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${mode === p ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-28">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[48px] overflow-hidden shadow-2xl">
            <div className="px-10 py-6 bg-[var(--surface-hover)]/30 border-b border-[var(--border)] flex justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest">Workspace</span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)]">{language}</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors uppercase">Load</button>
                <button onClick={() => { textareaRef.current?.focus(); textareaRef.current?.select(); }} className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors uppercase">Select</button>
                <button onClick={() => { setCode(''); setResult(null); }} className="text-[10px] font-black text-[var(--text-muted)] hover:text-red-500 transition-colors uppercase">Clear</button>
              </div>
            </div>
            
            <div className="flex bg-[var(--bg)] relative h-[500px]">
              <div ref={gutterRef} className="w-14 bg-[var(--surface-hover)] border-r border-[var(--border)] select-none overflow-hidden py-10 font-mono text-[11px] flex flex-col items-center">
                {lines.map((_, i) => (
                  <div key={i} className="h-[1.4rem] w-full flex items-center justify-center relative">
                    <span className="text-[var(--text-muted)] opacity-30">{i+1}</span>
                    {result?.issues.some(iss => iss.line === i+1) && (
                      <div className="absolute left-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]" />
                    )}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
                className="flex-1 bg-transparent text-[var(--text-main)] py-10 px-8 mono text-sm outline-none resize-none scrollbar-hide font-medium leading-[1.4rem] whitespace-pre"
                spellCheck={false}
              />
            </div>

            <div className="p-8 bg-[var(--surface-hover)] border-t border-[var(--border)] flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">Telemetry</span>
                  <span className="text-xs font-bold">{lines.length} L / {result?.issues.length || 0} A</span>
              </div>
              <button onClick={() => handleAnalyze(false)} disabled={loading} className="px-14 py-4.5 bg-[var(--primary)] text-white rounded-[28px] font-black text-sm transition-all shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest">
                {loading ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-microchip mr-3"></i>}
                {loading ? 'Processing' : 'Analyze'}
              </button>
            </div>
          </div>
          <LogTerminal logs={logs} containerRef={logContainerRef} />
        </div>

        <div className="lg:col-span-7 space-y-12 pb-24">
          {!result && !loading ? <EmptyPlaceholder mode={mode} /> : loading ? <div className="animate-pulse space-y-12"><div className="h-64 bg-[var(--surface)] rounded-[48px]" /><div className="h-96 bg-[var(--surface)] rounded-[48px]" /></div> : result && (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard label="Integrity" value={result.metrics.overallHealth} color="var(--primary)" icon="fas fa-heart-pulse" />
                <MetricCard label="Security" value={result.metrics.securityScore} color="#ef4444" icon="fas fa-shield-halved" />
                <MetricCard label="Velocity" value={result.metrics.performanceScore} color="#eab308" icon="fas fa-gauge-max" />
                <MetricCard label="Modularity" value={result.metrics.maintainabilityScore} color="#f59e0b" icon="fas fa-cubes-stacked" />
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[56px] p-12 relative shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <h4 className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.3em]">Technical Audit</h4>
                  <button onClick={() => { navigator.clipboard.writeText(result.summary); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }} className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[var(--border)]">
                    {copySuccess ? 'Copied' : 'Copy Report'}
                  </button>
                </div>
                <div className="text-[var(--text-main)] text-lg font-medium leading-[1.8] whitespace-pre-wrap">{result.summary}</div>
              </div>

              <div className="grid grid-cols-1 gap-12">
                <IssuesPanel issues={result.issues} />
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Refactoring Engine</span>
                    <button 
                      onClick={() => handleAnalyze(true)}
                      className="text-[10px] font-black text-[var(--primary)] hover:text-white transition-colors bg-[var(--primary)]/10 px-4 py-2 rounded-full border border-[var(--primary)]/30 flex items-center gap-2"
                    >
                      <i className="fas fa-sparkles"></i> Regenerate Alternative
                    </button>
                  </div>
                  <CodeComparison 
                    original={code} 
                    optimized={result.optimizedCode} 
                    language={result.languageDetected}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
