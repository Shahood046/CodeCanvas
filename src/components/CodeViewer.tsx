
import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Server, Network, Eye, Code as CodeIcon, Info, Layout, Sparkles, ExternalLink, Beaker, FileCode } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  testCode?: string; // Optional test code for Replica Mode
  explanation?: string;
  type: 'ui-wireframe' | 'ui-modern' | 'devops-compose' | 'devops-mermaid' | 'ui-replica';
  label: string;
}

const getPreviewHtml = (code: string | undefined, mode: 'wireframe' | 'modern') => {
  if (!code) return '';
  let sanitizedCode = code;
  let injectedVariables = '';
  
  try {
    // --- 1. Import Handling Strategy ---
    
    // A. Lucide React Handling
    const lucideImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?/g;
    let match;
    const lucideIcons = new Set<string>();
    while ((match = lucideImportRegex.exec(sanitizedCode)) !== null) {
      const imports = match[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(s => s);
      imports.forEach(icon => lucideIcons.add(icon));
    }
    if (lucideIcons.size > 0) {
      injectedVariables += `const { ${Array.from(lucideIcons).join(', ')} } = window.Lucide;\n`;
    }

    // B. Framer Motion Handling
    const framerImportRegex = /import\s+{([^}]+)}\s+from\s+['"]framer-motion['"];?/g;
    const framerComponents = new Set<string>();
    while ((match = framerImportRegex.exec(sanitizedCode)) !== null) {
        const imports = match[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(s => s);
        imports.forEach(c => framerComponents.add(c));
    }
    if (framerComponents.size > 0) {
        injectedVariables += `const { ${Array.from(framerComponents).join(', ')} } = window.FramerMotion;\n`;
    }

    // C. Common Utils Handling (clsx, tailwind-merge)
    sanitizedCode = sanitizedCode.replace(/import\s+.*from\s+['"]clsx['"];?/g, '');
    sanitizedCode = sanitizedCode.replace(/import\s+.*from\s+['"]tailwind-merge['"];?/g, '');
    
    // D. Remove ALL other imports
    sanitizedCode = sanitizedCode.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '');
    
    // --- 2. Intelligent "App" Component Detection ---
    if (/export\s+default\s+function\s+App/.test(sanitizedCode)) {
      sanitizedCode = sanitizedCode.replace(/export\s+default\s+/, '');
    } 
    else if (/export\s+default\s+function\s+\w+/.test(sanitizedCode)) {
      sanitizedCode = sanitizedCode.replace(/export\s+default\s+function\s+(\w+)/, 'function App');
    }
    else {
        const defaultExportMatch = sanitizedCode.match(/export\s+default\s+(\w+);?/);
        if (defaultExportMatch) {
            const exportedName = defaultExportMatch[1];
            sanitizedCode = sanitizedCode.replace(/export\s+default\s+(\w+);?/, '');
            if (exportedName !== 'App') {
                sanitizedCode += `\nconst App = ${exportedName};`;
            }
        }
    }

  } catch (e) {
    console.warn("Code sanitization failed:", e);
    return `<!DOCTYPE html><html><body><div style="color:red">Error preparing preview: ${(e as Error).message}</div></body></html>`;
  }

  // Escape code for template literal injection
  // We double-escape backslashes, escape backticks, and escape dollar signs (to prevent interpolation)
  const safeCode = (sanitizedCode || '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <style>
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
        #error-display { display: none; padding: 20px; background: #FEF2F2; color: #991B1B; border-bottom: 2px solid #FECACA; font-family: sans-serif; }
        #root { display: block; }
      </style>
    </head>
    <body class="${mode === 'wireframe' ? 'bg-white' : 'bg-slate-50'}">
      <div id="error-display"></div>
      <div id="root"></div>
      
      <script>
        // --- Error Handling Utility ---
        function showError(err, type = 'Runtime') {
            const el = document.getElementById('error-display');
            const root = document.getElementById('root');
            if (el) {
                el.style.display = 'block';
                el.innerHTML = '<strong>' + type + ' Error:</strong><br/><pre style="white-space:pre-wrap;margin-top:8px;font-size:12px;opacity:0.8">' + (err.message || err.toString()) + '</pre>';
            }
            // Log to console for debugging
            console.error(err);
        }

        window.onerror = function(msg, url, line, col, error) {
            showError(error || msg, 'Uncaught');
            return true;
        };

        // --- Polyfills & Mocks ---
        window.process = { env: { NODE_ENV: 'development' } };
        
        // standard 'clsx' implementation
        const clsx = (...args) => {
           const toVal = (mix) => {
             var k, y, str='';
             if (typeof mix === 'string' || typeof mix === 'number') {
               str += mix;
             } else if (typeof mix === 'object') {
               if (Array.isArray(mix)) {
                 for (k=0; k < mix.length; k++) {
                   if (mix[k]) {
                     if (y = toVal(mix[k])) {
                       str && (str += ' ');
                       str += y;
                     }
                   }
                 }
               } else {
                 for (k in mix) {
                   if (mix[k]) {
                     str && (str += ' ');
                     str += k;
                   }
                 }
               }
             }
             return str;
           }
           return args.map(toVal).filter(Boolean).join(' ');
        }
        
        const twMerge = (...args) => clsx(...args);
        const cn = (...args) => twMerge(clsx(...args));

        // Mock Lucide Icons
        window.Lucide = new Proxy({}, { 
            get: (t, p) => (props) => React.createElement('span', { 
                ...props, 
                style: { 
                  ...props.style, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  minWidth: '1em',
                  minHeight: '1em'
                },
                className: ('lucide lucide-' + p.toString().toLowerCase() + ' ' + (props.className || '')).trim()
            }, [
              React.createElement('svg', { 
                width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round",
                style: { width: '100%', height: '100%' }
              }, [
                 React.createElement('rect', { x: "2", y: "2", width: "20", height: "20", rx: "5", strokeOpacity: "0.2" }),
                 React.createElement('text', { x: "12", y: "16", textAnchor: "middle", fontSize: "10", stroke: "none", fill: "currentColor" }, p.toString().substr(0, 2))
              ])
            ]) 
        });

        // Mock Framer Motion
        const createMotionValue = (v) => ({
            get: () => v,
            getVelocity: () => 0,
            set: () => {},
            on: () => () => {},
            onChange: () => () => {},
            destroy: () => {},
            stop: () => {},
            isAnimating: () => false,
        });

        window.FramerMotion = {
            motion: new Proxy({}, {
                get: (target, prop) => {
                    return React.forwardRef((props, ref) => {
                         const { 
                            initial, animate, exit, transition, variants, 
                            whileHover, whileTap, whileDrag, whileFocus, 
                            viewport, onViewportEnter, onViewportLeave,
                            ...domProps 
                        } = props;
                        return React.createElement(prop, { ...domProps, ref });
                    });
                }
            }),
            AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
            useScroll: () => ({ 
                scrollY: createMotionValue(0), 
                scrollYProgress: createMotionValue(0),
                scrollX: createMotionValue(0),
                scrollXProgress: createMotionValue(0)
            }),
            useTransform: () => createMotionValue(0),
            useSpring: () => createMotionValue(0),
            useAnimation: () => ({ start: () => {}, stop: () => {} }),
            useMotionValue: (v) => createMotionValue(v),
        };

        // --- Execution Engine ---
        try {
            // 1. Destructure React Globals so they are available in scope
            const { useState, useEffect, useRef, useMemo, useCallback, useReducer, createContext, useContext } = React;
            
            // 2. Injected Variables (Icons etc)
            ${injectedVariables}
            
            // 3. User Code Raw String
            const rawCode = \`${safeCode}\`;
            
            // 4. Compile with Babel explicitly (catches SyntaxErrors)
            const compiled = Babel.transform(rawCode, {
                presets: ['react', ['env', { modules: false }]],
                filename: 'app.tsx'
            }).code;

            // 5. Execute Code (catches RuntimeErrors)
            eval(compiled);
            
            // 6. Mount App
            if (typeof App !== 'undefined') {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                
                // Add an internal ErrorBoundary for React render errors
                class InnerErrorBoundary extends React.Component {
                    constructor(props) {
                        super(props);
                        this.state = { hasError: false, error: null };
                    }
                    static getDerivedStateFromError(error) {
                        return { hasError: true, error };
                    }
                    componentDidCatch(error) {
                        showError(error, 'Render');
                    }
                    render() {
                        if (this.state.hasError) return null;
                        return this.props.children;
                    }
                }

                root.render(React.createElement(InnerErrorBoundary, null, React.createElement(App)));
            } else {
                throw new Error("Component 'App' is not defined. Ensure your code exports or defines 'function App'.");
            }

        } catch (e) {
            showError(e, e.name === 'SyntaxError' ? 'Syntax' : 'Compilation');
        }
      </script>
    </body>
    </html>`;
};

const getMermaidHtml = (def: string | undefined) => {
  if (!def) return '';
  let cleanDef = def.replace(/```mermaid/g, '').replace(/```/g, '').trim();
  if (!cleanDef.startsWith('graph') && !cleanDef.startsWith('flowchart')) {
     cleanDef = 'graph TD\n' + cleanDef;
  }
  
  // Sanitize common syntax issues that break Mermaid
  cleanDef = cleanDef
    // Remove parentheses from labels (they have special meaning in Mermaid)
    .replace(/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g, '[$1$2$3]')
    // Replace forward slashes with spaces in labels
    .replace(/\[([^\]]*)\//g, '[' + '$1 ');
  
  // Escape backticks and dollar signs for safe template literal injection
  const safeCode = cleanDef.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  return `
  <!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body { margin:0; padding:2rem; display:flex; justify-content:center; align-items:center; background:#fff; min-height:100vh; font-family: sans-serif; }
    #diagram-container { width:100%; max-width:1200px; }
    #error-display { display:none; color:#991B1B; background:#FEF2F2; padding:20px; border-radius:8px; border:2px solid #FECACA; font-family:monospace; white-space:pre-wrap; max-width:800px; font-size:13px; line-height:1.5; }
    .error-title { font-weight:bold; margin-bottom:10px; font-size:14px; }
  </style>
  </head>
  <body>
    <div id="diagram-container"></div>
    <div id="error-display"></div>
    <script>
      try {
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'neutral', 
          securityLevel: 'loose',
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
        });
        const code = \`${safeCode}\`;
        mermaid.render('diagram', code).then(result => {
          document.getElementById('diagram-container').innerHTML = result.svg;
        }).catch(err => {
          const errorEl = document.getElementById('error-display');
          errorEl.style.display = 'block';
          errorEl.innerHTML = '<div class="error-title">🚫 Mermaid Syntax Error</div>' + 
                              'The AI generated invalid Mermaid diagram syntax.\\n\\n' +
                              '<strong>Error:</strong>\\n' + err.message + '\\n\\n' +
                              '<strong>Generated Code:</strong>\\n' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          console.error('Mermaid error:', err, 'Code:', code);
        });
      } catch(e) { 
        document.getElementById('error-display').style.display = 'block';
        document.getElementById('error-display').innerHTML = '<div class="error-title">🚫 Initialization Error</div>' + e.message; 
      }
    </script>
  </body></html>`;
};

export const CodeViewer: React.FC<CodeViewerProps> = ({ code = "", testCode = "", explanation, type, label }) => {
  const [view, setView] = useState<'preview' | 'code' | 'tests'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setView(type.includes('mermaid') || type.includes('ui') ? 'preview' : 'code');
  }, [type]);

  const previewSrcDoc = useMemo(() => {
    try {
      if (type === 'devops-mermaid') return getMermaidHtml(code);
      if (type === 'ui-wireframe') return getPreviewHtml(code, 'wireframe');
      if (type === 'ui-modern' || type === 'ui-replica') return getPreviewHtml(code, 'modern');
      return `<!DOCTYPE html><html><body style="background:#0f172a;color:#94a3b8;padding:2rem;font-family:monospace;white-space:pre;">${code || 'No code generated.'}</body></html>`;
    } catch (e) {
      return `<!DOCTYPE html><html><body><div style="color:red;padding:20px">Error generating preview: ${(e as Error).message}</div></body></html>`;
    }
  }, [code, type]);

  const Icon = type.includes('ui') ? (type.includes('wireframe') ? Layout : Sparkles) : (type.includes('mermaid') ? Network : Server);
  const displayCode = view === 'tests' ? testCode : code;

  return (
    <div className="flex flex-col h-full min-h-[700px] bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl transition-all">
      <div className="bg-slate-950/80 px-5 py-4 flex items-center justify-center sm:justify-between border-b border-white/5 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Icon size={18} /></div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {type.includes('ui') && (
            <button 
              onClick={() => {
                 const win = window.open();
                 if (win) {
                    win.document.write(previewSrcDoc);
                    win.document.close();
                 }
              }} 
              className="text-slate-500 hover:text-white transition-colors p-2"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
            <button onClick={() => setView('preview')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${view === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <Eye size={12} /> Preview
            </button>
            <button onClick={() => setView('code')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${view === 'code' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <CodeIcon size={12} /> Source
            </button>
            {type === 'ui-replica' && testCode && (
              <button onClick={() => setView('tests')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${view === 'tests' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <Beaker size={12} /> QA Tests
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
        {view === 'preview' ? (
          <iframe 
            srcDoc={previewSrcDoc} 
            className="w-full h-full border-none bg-white" 
            sandbox="allow-scripts allow-same-origin allow-popups"
            title="Preview" 
          />
        ) : (
          <div className="flex-1 overflow-auto p-6 relative">
            <button onClick={() => { navigator.clipboard.writeText(displayCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            <pre className="font-mono text-xs text-slate-300 leading-relaxed"><code>{displayCode}</code></pre>
          </div>
        )}
      </div>
      {explanation && (
        <div className="bg-slate-950/60 p-5 border-t border-white/5 flex items-start gap-3">
          <Info size={14} className="text-primary-400 mt-1 shrink-0" />
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Architect's Insight</h4>
            <p className="text-sm text-slate-300 italic">"{explanation}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
