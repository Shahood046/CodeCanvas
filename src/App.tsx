
import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CodeViewer } from './components/CodeViewer';
import { RefinementChat } from './components/RefinementChat';
import { DecisionTracePanel } from './components/DecisionTracePanel';
import { ConstraintSelector } from './components/ConstraintSelector';
import { ViolationReport } from './components/ViolationReport';
import { analyzeImage, refineCode } from './services/geminiService';
import { validateConstraints } from './services/constraintService';
import { AnalysisResult, AnalysisStatus, AppMode, UIAnalysisResult, DevOpsAnalysisResult, ReplicaAnalysisResult, DecisionTrace, Violation } from './types';
import { 
  Network, 
  Code2, 
  AlertCircle, 
  Loader2, 
  Cpu, 
  Zap, 
  ArrowRight, 
  PlusCircle, 
  ChevronLeft, 
  History, 
  Terminal, 
  Layout,
  Layers, 
  Container,
  MousePointer2,
  Sparkles,
  Github,
  RefreshCw,
  ImageOff,
  BrainCircuit,
  ShieldCheck,
  ShieldAlert,
  Copy,
  ScanEye
} from 'lucide-react';

const CACHE_KEY = 'codecanvas_master_session';

const DOCS_CONTENT = `# 📘 CodeCanvas AI — Technical Documentation

## 1. Core Philosophy
CodeCanvas AI is a constrained multimodal compiler that converts visual software artifacts (sketches, screenshots, diagrams) into deterministic, executable code with verification.

**What it is NOT:**
❌ A generic code generator
❌ A UI mockup tool
❌ A “design-to-code” toy

It is a visual-to-code synthesis system with explicit contracts, modes, and verification guarantees.

## 2. Operating Modes
CodeCanvas operates under explicit compilation modes. Each mode enforces different guarantees and constraints.

### 🎨 2.1 Frontend Synthesizer (UI Mode)
- **Input**: Hand-drawn wireframes, UI screenshots, Reference videos (≤ 10s).
- **Output**: React 19 (TypeScript), Tailwind CSS, Deterministic Component Hierarchy.
- **Guarantees**:
  - **Layout-First Synthesis**: Structure is prioritized before styling.
  - **Semantic Inference**: Boxes are resolved to Button, Card, Modal, Input.
  - **No Backend Assumptions**: Generates pure frontend presentation layers.

### ⚙️ 2.2 DevOps Architect (Infrastructure Mode)
- **Input**: System architecture diagrams, Service topology sketches.
- **Output**: docker-compose.yml (v3.8), Mermaid.js topology graph.
- **Guarantees**:
  - **Dependency Ordering**: Services wait for dependencies (e.g., depends_on).
  - **Network Isolation**: Correct implementation of internal/external networks.
  - **Executable**: Results are immediately runnable via Docker Desktop.

### 📸 2.3 Replica Mode Contract
Used for reconstructing real websites from screenshots or video.
- ✅ **Structural Replication**: Preserves visual hierarchy and spacing.
- ✅ **Interaction Inference**: Infers onClick and useState from video affordances.
- ❌ **No Hallucinations**: No invented content or fabricated data sources. Real text is preserved; missing data uses neutral placeholders.

## 3. The Multimodal Reasoning Engine
CodeCanvas uses Gemini 3 Pro Vision as a joint reasoning engine, not a stochastic text generator.

| Gemini IS Used For | Gemini is NOT Used For |
| :--- | :--- |
| Spatial layout reasoning | Free-form code hallucination |
| Hierarchy detection | Styling creativity without basis |
| Symbol/Icon interpretation | Guessing backend business logic |
| Ambiguity resolution | |

All AI outputs pass through a **Deterministic Synthesis Layer** before code emission to ensure syntax safety.

## 4. The Synthesis Pipeline
1. **Visual Decomposition**: Bounding boxes → Spatial Grouping → Hierarchy Extraction.
2. **Semantic Mapping**: UI Elements mapped to React Components; Icons mapped to lucide-react.
3. **Deterministic Emission**: Generation of the React Component Tree and Tailwind Utility classes.
4. **QA Sentinel**: Automated generation of \`App.test.tsx\` to verify the output matches the input intent.

## 5. QA Sentinel (Verification Layer)
Exists to answer: *"Is this output production-ready?"*
CodeCanvas does not aim for 100% test coverage. It enforces **Minimum Engineering Correctness**:
- **Structural Sanity**: Does the Navbar actually exist?
- **Interaction Validation**: Do buttons fire events? Do inputs accept text?
- **Accessibility (A11y)**: Are aria-labels and roles present?

## 6. The Browser Build Engine
**The Problem**: Browsers cannot execute raw ESM imports (like \`import { Home } from 'lucide-react'\`) directly.
**The Solution**: CodeCanvas includes a custom Sanitization & Proxy Layer:
- Strips unsupported or dangerous imports.
- Injects a **Mock Icon Proxy** to handle generic icon requests without crashing.
- Allows for instant, live previews without a heavy backend build server.

## 7. Intended Audience
If you think in sketches, diagrams, or screenshots, CodeCanvas is built for you:
- Frontend Engineers
- System Architects
- Rapid Prototyping Teams
- Hackathon Builders

> "CodeCanvas is intentionally constrained. Those constraints are the feature, not a limitation."
`;

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to prevent white screen crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6 text-sm">
              The application encountered an unexpected error.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-400 font-mono">{this.state.error?.message}</code>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem(CACHE_KEY);
                window.location.reload();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Reset & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('ui');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>("");
  const [activeConstraints, setActiveConstraints] = useState<string[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCachedSession, setHasCachedSession] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  
  const toolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check localStorage for active session on boot
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setHasCachedSession(true);
  }, []);

  useEffect(() => {
    // Smart Caching Strategy - Avoid quota issues by checking size first
    if (status === AnalysisStatus.SUCCESS && result) {
      // Check if image is too large (> 1MB base64 = ~750KB actual)
      const imageSizeBytes = selectedImage ? selectedImage.length : 0;
      const shouldSaveImage = imageSizeBytes < 1_000_000; // 1MB limit
      
      const stateToSave = {
        mode,
        result,
        selectedImage: shouldSaveImage ? selectedImage : null,
        instructions,
        activeConstraints
      };
      
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(stateToSave));
        setHasCachedSession(true);
      } catch (e) {
        // Final fallback: Save without any image data
        try {
          const minimalState = { mode, result, instructions, activeConstraints };
          localStorage.setItem(CACHE_KEY, JSON.stringify(minimalState));
          setHasCachedSession(true);
        } catch (innerE) {
          console.error("Cannot save session. LocalStorage might be full.", innerE);
        }
      }
    }
  }, [status, result, selectedImage, instructions, mode, activeConstraints]);

  const handleRestore = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setMode(data.mode || 'ui');
        setResult(data.result);
        setSelectedImage(data.selectedImage); // Might be null if quota was hit previously
        setInstructions(data.instructions);
        setActiveConstraints(data.activeConstraints || []);
        setStatus(AnalysisStatus.SUCCESS);
        setTimeout(() => scrollToTool(), 100);
      } catch (e) { 
          localStorage.removeItem(CACHE_KEY); 
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setViolations([]);

    try {
      const analysisResult = await analyzeImage(selectedImage, mode, instructions, activeConstraints);
      
      // --- Deterministic Constraint Validation Step ---
      let codeToCheck = "";
      if (mode === 'ui') {
        codeToCheck = (analysisResult as UIAnalysisResult).modern_code;
      } else if (mode === 'replica') {
        codeToCheck = (analysisResult as ReplicaAnalysisResult).code;
      } else {
        codeToCheck = (analysisResult as DevOpsAnalysisResult).docker_compose;
      }

      const detectedViolations = validateConstraints(codeToCheck, activeConstraints, mode);
      setViolations(detectedViolations); // Always track violations
      
      if (detectedViolations.some(v => v.severity === 'hard')) {
        setResult(analysisResult); // Store result but block view
        setStatus(AnalysisStatus.VIOLATION);
      } else {
        setResult(analysisResult);
        setStatus(AnalysisStatus.SUCCESS);
        // Automatically open compliance modal if soft violations exist
        if (detectedViolations.length > 0) {
            setShowComplianceModal(true);
        }
      }
      
      setTimeout(() => scrollToTool(), 100);

    } catch (err: any) {
      setError(err.message || "Synthesis failed. Please check your API key or image quality.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleRefinement = async (instruction: string) => {
    if (!result) return;
    setIsRefining(true);
    try {
      let currentCodeInput = "";
      
      // Prepare context for refinement based on mode
      if (mode === 'ui') {
        currentCodeInput = (result as UIAnalysisResult).modern_code;
      } else if (mode === 'replica') {
        currentCodeInput = (result as ReplicaAnalysisResult).code;
      } else {
        // For DevOps, send both artifacts to ensure they stay in sync or are fixed together
        const devopsResult = result as DevOpsAnalysisResult;
        currentCodeInput = JSON.stringify({
          docker_compose: devopsResult.docker_compose,
          mermaid_diagram: devopsResult.mermaid_diagram
        });
      }

      const refinedOutput = await refineCode(currentCodeInput, mode, instruction);

      // Validate refinement output before updating state
      if (!refinedOutput || refinedOutput.trim().length === 0) {
        throw new Error('AI returned empty refinement');
      }

      setResult(prev => {
        if (!prev) return null;
        
        if (mode === 'ui') {
          return {
            ...prev as UIAnalysisResult,
            modern_code: refinedOutput,
            modern_explanation: "Updated based on refinement request."
          };
        } else if (mode === 'replica') {
           return {
             ...prev as ReplicaAnalysisResult,
             code: refinedOutput,
             explanation: "Updated based on refinement request."
           }
        } else {
          // Parse JSON output for DevOps refinement
          try {
             // Handle cases where the model might still wrap JSON in markdown despite instructions
             const cleanJson = refinedOutput.replace(/```json/g, '').replace(/```/g, '').trim();
             const parsed = JSON.parse(cleanJson);
             return {
                ...prev as DevOpsAnalysisResult,
                docker_compose: parsed.docker_compose || (prev as DevOpsAnalysisResult).docker_compose,
                mermaid_diagram: parsed.mermaid_diagram || (prev as DevOpsAnalysisResult).mermaid_diagram,
                explanation: "Updated based on refinement request."
             };
          } catch (e) {
             console.error("Failed to parse refined DevOps JSON. Keeping original.", e);
             // Don't update if parsing failed
             return prev;
          }
        }
      });
    } catch (err: any) {
      console.error("Refinement failed:", err);
      // Show error to user
      setError(`Refinement failed: ${err.message || 'AI returned invalid code'}. Please try rephrasing your request.`);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsRefining(false);
    }
  };

  const handleTraceOverride = (item: DecisionTrace) => {
     setShowTrace(false);
     const overrideInstruction = `Trace Override: The element "${item.element_id}" (originally interpreted as "${item.chosen_interpretation}") was incorrect. Please change it to something else appropriate for the context or as specified by the user. Update the code to reflect this change.`;
     handleRefinement(overrideInstruction);
  };

  const handleOpenDocs = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Robust serialization using JSON.stringify to handle all special characters/newlines safely
    const serializedMarkdown = JSON.stringify(DOCS_CONTENT);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en" class="scroll-smooth">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodeCanvas AI Documentation</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/lib/marked.umd.js"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
              },
              colors: {
                slate: { 850: '#151e2e' }
              },
              maxWidth: {
                'doc': '840px'
              }
            }
          }
        }
      </script>
      <style>
        body { background-color: #0B1120; color: #E2E8F0; }
        
        /* Markdown Content Styling - Stripe/Vercel inspired */
        .markdown-body { padding-bottom: 4rem; }
        .markdown-body h1 { font-size: 2.75rem; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 2rem; color: white; line-height: 1.1; }
        .markdown-body h2 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.025em; margin-top: 3.5rem; margin-bottom: 1.25rem; color: #F8FAFC; padding-bottom: 0.75rem; border-bottom: 1px solid #1E293B; scroll-margin-top: 100px; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 1rem; color: #E2E8F0; scroll-margin-top: 100px; }
        .markdown-body p { margin-bottom: 1.5rem; line-height: 1.8; color: #94A3B8; font-size: 1.05rem; }
        .markdown-body ul { list-style-type: none; padding-left: 0; margin-bottom: 1.5rem; }
        .markdown-body li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #94A3B8; line-height: 1.7; }
        .markdown-body li::before { content: "—"; position: absolute; left: 0; color: #38BDF8; font-weight: bold; }
        .markdown-body strong { color: #F1F5F9; font-weight: 600; }
        .markdown-body code { background: #1E293B; color: #38BDF8; padding: 0.2rem 0.4rem; rounded: 0.375rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; border: 1px solid #334155; }
        .markdown-body pre { background: #0F172A; padding: 1.5rem; rounded-2xl; overflow-x: auto; margin-bottom: 2rem; border: 1px solid #1E293B; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .markdown-body pre code { background: transparent; padding: 0; border: none; color: #E2E8F0; font-size: 0.9em; }
        .markdown-body blockquote { border-left: 4px solid #38BDF8; background: linear-gradient(to right, rgba(56, 189, 248, 0.1), transparent); padding: 1.5rem; border-radius: 0 1rem 1rem 0; margin-bottom: 2rem; color: #E2E8F0; font-style: italic; }
        
        /* Table Styling */
        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 2rem; border: 1px solid #334155; rounded: 0.75rem; overflow: hidden; border-radius: 0.75rem; }
        .markdown-body th { text-align: left; padding: 1rem; background: #1E293B; color: #F8FAFC; font-weight: 600; border-bottom: 1px solid #334155; }
        .markdown-body td { padding: 1rem; border-bottom: 1px solid #1E293B; color: #94A3B8; background: #0F172A; }
        .markdown-body tr:last-child td { border-bottom: none; }

        /* Sidebar Link */
        .sidebar-link { font-size: 0.9rem; color: #64748B; transition: all 0.2s; border-left: 2px solid transparent; padding-left: 1rem; display: block; padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .sidebar-link:hover { color: #CBD5E1; border-left-color: #475569; }
        .sidebar-link.active { color: #38BDF8; border-left-color: #38BDF8; font-weight: 500; }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      </style>
    </head>
    <body class="antialiased">
      <!-- Fixed Navbar -->
      <nav class="fixed top-0 w-full z-50 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-[#0B1120]/60">
        <div class="max-w-[90rem] mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3">
             <div class="bg-gradient-to-br from-sky-500 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
             </div>
             <span class="font-bold text-white tracking-tight text-lg">CodeCanvas <span class="text-sky-400">Docs</span></span>
          </div>
          <div class="flex items-center gap-4">
             <span class="px-2 py-1 bg-white/5 rounded text-xs font-mono text-slate-500 border border-white/5">v2.4.0</span>
          </div>
        </div>
      </nav>

      <div class="max-w-[90rem] mx-auto px-6 pt-28 pb-20">
        <div class="flex flex-col lg:flex-row gap-16 relative">
          
          <!-- Sticky Sidebar -->
          <aside class="hidden lg:block w-64 shrink-0 fixed h-[calc(100vh-8rem)] top-28 overflow-y-auto pr-4 no-scrollbar">
             <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-4">Contents</h4>
             <ul id="toc" class="space-y-1"></ul>
          </aside>

          <!-- Main Content Area -->
          <main class="flex-1 lg:ml-80 min-w-0">
             <div class="max-w-3xl mx-auto">
                <div id="content" class="markdown-body"></div>
             </div>
             
             <!-- Footer -->
             <div class="max-w-3xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
                <span>© 2025 CodeCanvas Lab. All rights reserved.</span>
                <div class="flex gap-6">
                   <a href="#" class="hover:text-slate-300 transition-colors">Privacy</a>
                   <a href="#" class="hover:text-slate-300 transition-colors">Terms</a>
                   <a href="#" class="hover:text-slate-300 transition-colors">GitHub</a>
                </div>
             </div>
          </main>
          
        </div>
      </div>

      <script>
        const markdown = ${serializedMarkdown};
        
        try {
            // Configure Marked with a custom renderer for heading IDs
            const renderer = new marked.Renderer();
            renderer.heading = function(text, level) {
                const escapedText = text.toLowerCase().replace(/[^\\w\\u4e00-\\u9fa5]+/g, '-');
                return \`<h\${level} id="\${escapedText}">\${text}</h\${level}>\`;
            };

            // Use the renderer
            marked.use({ renderer });

            // Parse and render
            document.getElementById('content').innerHTML = marked.parse(markdown);

            // Generate Table of Contents dynamically
            const toc = document.getElementById('toc');
            const headers = document.querySelectorAll('.markdown-body h2, .markdown-body h3');
            
            if (headers.length > 0) {
                headers.forEach(header => {
                    const level = parseInt(header.tagName.substring(1));
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    const id = header.id;
                    
                    a.href = '#' + id;
                    a.textContent = header.textContent.replace(/^\\d+\\.\\s*/, ''); // Remove numbering if present for clearer TOC
                    a.className = \`sidebar-link \${level === 3 ? 'ml-4' : ''}\`;
                    
                    a.onclick = (e) => {
                        e.preventDefault();
                        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
                        history.pushState(null, null, '#' + id);
                    };

                    li.appendChild(a);
                    toc.appendChild(li);
                });
            } else {
                toc.innerHTML = '<li class="text-sm text-slate-600 pl-4 italic">No sections found</li>';
            }

            // Intersection Observer for Scroll Spy
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
                        const id = entry.target.id;
                        const link = document.querySelector(\`.sidebar-link[href="#\${id}"]\`);
                        if (link) link.classList.add('active');
                    }
                });
            }, { rootMargin: '-100px 0px -60% 0px' });

            headers.forEach(h => observer.observe(h));
            
        } catch (error) {
            console.error(error);
            document.getElementById('content').innerHTML = \`<div class="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
                <strong>Error rendering documentation:</strong> \${error.message}
            </div>\`;
        }
      </script>
    </body>
    </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // View States
  const showResults = status === AnalysisStatus.SUCCESS && result;
  const showViolations = status === AnalysisStatus.VIOLATION && result;
  const isAnalyzing = status === AnalysisStatus.ANALYZING;

  // Compliance Badge Logic
  const hasViolations = violations.length > 0;

  // Helper to render correct CodeViewer for mode
  const renderResults = () => {
     if (mode === 'ui') {
        return (
            <CodeViewer 
                type="ui-modern" 
                label="Production Interface" 
                code={(result as UIAnalysisResult).modern_code} 
                explanation={(result as UIAnalysisResult).modern_explanation} 
            />
        );
     } else if (mode === 'replica') {
        const r = result as ReplicaAnalysisResult;
        return (
            <CodeViewer 
                type="ui-replica" 
                label="Visual Replica" 
                code={r.code} 
                testCode={r.test_code}
                explanation={r.explanation}
            />
        );
     } else {
        return (
            <CodeViewer 
                type="devops-compose" 
                label="Docker Architecture" 
                code={(result as DevOpsAnalysisResult).docker_compose} 
                explanation={(result as DevOpsAnalysisResult).explanation} 
            />
        );
     }
  };
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans selection:bg-sky-500/30">
        {/* Dynamic Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] transition-opacity duration-1000 ${mode === 'ui' || mode === 'replica' ? 'opacity-100' : 'opacity-20'}`}></div>
          <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] transition-opacity duration-1000 ${mode === 'devops' ? 'opacity-100' : 'opacity-20'}`}></div>
        </div>

        <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-[100]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
                <Code2 size={22} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">CodeCanvas<span className="text-sky-400">AI</span></h1>
            </div>
            
            <div className="hidden md:flex bg-slate-900/50 p-1 rounded-2xl border border-white/10 shadow-inner">
              <button 
                onClick={() => !isAnalyzing && setMode('ui')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'ui' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Layout size={14} /> UI GEN
              </button>
              <button 
                onClick={() => !isAnalyzing && setMode('replica')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'replica' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <ScanEye size={14} /> VISUAL REPLICA
              </button>
              <button 
                onClick={() => !isAnalyzing && setMode('devops')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'devops' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Terminal size={14} /> DEVOPS
              </button>
            </div>

            <div className="flex items-center gap-4">
              <a href="https://github.com/Shahood046/CodeCanvas" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                <Github size={20} />
              </a>
              <button 
                onClick={scrollToTool} 
                className="text-sm font-bold bg-white text-slate-950 px-5 py-2 rounded-full hover:bg-slate-200 transition-all active:scale-95"
              >
                Start Building
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 pb-24">
          {!showResults && !showViolations && (
            <>
              {/* Hero Section */}
              <section className="pt-24 pb-16 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <Sparkles size={14} className="animate-pulse" /> Advanced Synthesis Engine
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                  Draw your vision. <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">
                    Execute instantly.
                  </span>
                </h2>
                <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed">
                  Bridge the gap between concept and codebase. Transform sketches, diagrams, and screenshots into production-ready React & Docker artifacts—instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={scrollToTool}
                    className="group px-10 py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-sky-600/30 transition-all hover:scale-105"
                  >
                    Synthesize My Input
                    <ArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </section>

              {/* Feature Selection Cards */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                <div 
                  onClick={() => setMode('ui')}
                  className={`group p-6 rounded-[2rem] border transition-all cursor-pointer ${mode === 'ui' ? 'bg-sky-500/10 border-sky-500/50 shadow-2xl shadow-sky-500/10' : 'bg-white/5 border-white/10 hover:border-sky-500/30'}`}
                >
                  <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform">
                    <Layout size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Frontend Synthesizer</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Turn hand-drawn UI sketches into pixel-perfect React code.
                  </p>
                </div>

                <div 
                  onClick={() => setMode('replica')}
                  className={`group p-6 rounded-[2rem] border transition-all cursor-pointer ${mode === 'replica' ? 'bg-purple-500/10 border-purple-500/50 shadow-2xl shadow-purple-500/10' : 'bg-white/5 border-white/10 hover:border-purple-500/30'}`}
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                    <ScanEye size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Visual Replica</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Clone UIs from screenshots or video with interactive behavior & tests.
                  </p>
                </div>

                <div 
                  onClick={() => setMode('devops')}
                  className={`group p-6 rounded-[2rem] border transition-all cursor-pointer ${mode === 'devops' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'bg-white/5 border-white/10 hover:border-indigo-500/30'}`}
                >
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                    <Terminal size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">DevOps Architect</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Convert topology diagrams into Docker Compose infrastructure.
                  </p>
                </div>
              </section>
            </>
          )}

          {/* The Workspace */}
          <section id="tool" ref={toolRef} className="scroll-mt-24 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{showResults || showViolations ? 'Synthesis Complete' : 'Blueprint Lab'}</h3>
                <p className="text-slate-500 text-lg">
                    {mode === 'ui' ? 'Frontend' : mode === 'replica' ? 'Visual Reverse Engineering' : 'Infrastructure'} Mode Active
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(showResults || showViolations) && (
                  <>
                     {showResults && (
                        <>
                           <button 
                             onClick={() => setShowComplianceModal(true)} 
                             className={`px-4 py-3 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all
                               ${hasViolations 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                               }
                             `}
                           >
                             {hasViolations ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                             Compliance: {hasViolations ? `${violations.length} Issues` : 'Pass'}
                           </button>
                           
                           <button 
                            onClick={() => setShowTrace(true)} 
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl border border-white/10 text-sm font-bold flex items-center gap-2 transition-all"
                          >
                            <BrainCircuit size={18} /> Decision Trace
                          </button>
                        </>
                     )}
                    <button 
                      onClick={() => { setStatus(AnalysisStatus.IDLE); setViolations([]); }} 
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-sm font-bold text-white flex items-center gap-2 transition-all"
                    >
                      <ChevronLeft size={18} /> Modify Input
                    </button>
                  </>
                )}
                {!showResults && !showViolations && hasCachedSession && (
                  <button 
                    onClick={handleRestore} 
                    className="px-6 py-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/20 text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <History size={18} /> Restore Previous
                  </button>
                )}
                {(selectedImage || result) && (
                  <button 
                    onClick={() => { setSelectedImage(null); setStatus(AnalysisStatus.IDLE); setInstructions(""); setResult(null); setActiveConstraints([]); setViolations([]); }} 
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-sm font-bold text-slate-300 flex items-center gap-2 transition-all"
                  >
                    <PlusCircle size={18} /> New Draft
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 duration-500">
                {showResults ? (
                  mode === 'ui' ? (
                    <CodeViewer 
                      type="ui-wireframe" 
                      label="Structural Wireframe" 
                      code={(result as UIAnalysisResult).wireframe_code} 
                      explanation={(result as UIAnalysisResult).wireframe_explanation} 
                    />
                  ) : mode === 'devops' ? (
                    <CodeViewer 
                      type="devops-mermaid" 
                      label="System Topology" 
                      code={(result as DevOpsAnalysisResult).mermaid_diagram} 
                      explanation="Interactive architecture visualization" 
                    />
                  ) : mode === 'replica' ? (
                    <div className="bg-slate-900 rounded-3xl border border-white/10 p-6 flex flex-col gap-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <ScanEye size={18} className="text-purple-400"/> Analysis Source
                        </h3>
                        <div className="rounded-xl overflow-hidden border border-white/5 max-h-[500px] flex items-center justify-center bg-black">
                             {selectedImage?.startsWith('data:video') ? (
                                <video src={selectedImage} controls className="max-h-full max-w-full" />
                             ) : (
                                <img src={selectedImage || ''} alt="Analysis Source" className="object-contain max-h-full" />
                             )}
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-slate-400 font-mono">
                                <span className="text-purple-400 font-bold">DETECTED:</span> {(result as ReplicaAnalysisResult).explanation}
                            </p>
                        </div>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                <span className="text-xs text-slate-500 uppercase font-bold">Components</span>
                                <p className="text-2xl font-black text-white">{(result as ReplicaAnalysisResult).fidelity_report?.component_count || 0}</p>
                            </div>
                             <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                <span className="text-xs text-slate-500 uppercase font-bold">Interactions</span>
                                <p className="text-2xl font-black text-white">{(result as ReplicaAnalysisResult).fidelity_report?.detected_interactions?.length || 0}</p>
                            </div>
                         </div>
                    </div>
                  ) : (
                    <CodeViewer 
                      type="devops-compose" 
                      label="Docker Architecture" 
                      code={(result as DevOpsAnalysisResult).docker_compose} 
                      explanation={(result as DevOpsAnalysisResult).explanation} 
                    />
                  )
                ) : (
                  // Input Panel
                  !showViolations && (
                    <div className="flex flex-col gap-6">
                      <div className="relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r ${mode === 'ui' ? 'from-sky-500 to-blue-600' : mode === 'replica' ? 'from-purple-500 to-pink-600' : 'from-indigo-500 to-purple-600'} rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                        <div className="relative">
                          <ImageUploader onImageSelect={setSelectedImage} selectedImage={selectedImage} onClear={() => setSelectedImage(null)} disabled={isAnalyzing} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        <div className="glass p-6 rounded-[2rem] border border-white/10">
                          <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Layers size={18} className={mode === 'ui' ? 'text-sky-400' : mode === 'replica' ? 'text-purple-400' : 'text-indigo-400'} />
                            <label className="text-[10px] font-black uppercase tracking-[0.2em]">{mode === 'ui' ? 'Style / UI Directives' : mode === 'replica' ? 'Replica Intent' : 'Infrastructure Constraints'}</label>
                          </div>
                          <textarea 
                            value={instructions} 
                            onChange={e => setInstructions(e.target.value)} 
                            placeholder={mode === 'ui' ? "e.g., 'Modern SaaS landing page...'" : mode === 'replica' ? "e.g. 'Structural replica, ensure the navbar interaction is preserved...'" : "e.g., 'Deploy with Nginx load balancer...'"} 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-5 text-slate-200 outline-none h-32 focus:ring-2 focus:ring-sky-500/30 transition-all placeholder:text-slate-700" 
                          />
                        </div>

                        {/* Constraint Selector */}
                        <ConstraintSelector 
                          mode={mode} 
                          selectedConstraints={activeConstraints} 
                          onChange={setActiveConstraints}
                          disabled={isAnalyzing} 
                        />
                      </div>

                      <button 
                        onClick={handleAnalyze} 
                        disabled={!selectedImage || isAnalyzing} 
                        className={`w-full py-6 rounded-2xl font-black text-xl flex justify-center items-center gap-4 transition-all ${
                          !selectedImage || isAnalyzing 
                          ? 'bg-slate-800 text-slate-500 opacity-80 cursor-not-allowed' 
                          : mode === 'ui' 
                            ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-2xl shadow-sky-600/30 active:scale-95' 
                            : mode === 'replica'
                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-2xl shadow-purple-600/30 active:scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 active:scale-95'
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin" size={24} /> 
                            SYNTHESIZING...
                          </>
                        ) : (
                          <>
                            <Zap size={24} /> 
                            {mode === 'ui' ? 'SYNTHESIZE INTERFACE' : mode === 'replica' ? 'REVERSE ENGINEER UI' : 'GENERATE STACK'}
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95">
                          <AlertCircle size={22} className="shrink-0 mt-0.5" />
                          <p className="text-sm font-bold leading-relaxed">{error}</p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                {showViolations ? (
                   <ViolationReport 
                     violations={violations} 
                     isBlocking={true}
                     onRetry={() => { setStatus(AnalysisStatus.IDLE); setViolations([]); }}
                     onOverride={() => setStatus(AnalysisStatus.SUCCESS)}
                   />
                ) : showResults ? (
                    renderResults()
                ) : (
                  <div className="h-full min-h-[600px] flex flex-col items-center justify-center glass rounded-[2.5rem] border border-dashed border-white/10 p-12 text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
                    {isAnalyzing ? (
                      <div className="relative">
                        <div className={`absolute inset-0 blur-3xl opacity-20 animate-pulse ${mode === 'replica' ? 'bg-purple-500' : 'bg-sky-500'}`}></div>
                        <Loader2 size={64} className={`animate-spin relative z-10 ${mode === 'replica' ? 'text-purple-500' : 'text-sky-500'}`} />
                      </div>
                    ) : (
                      <div className="text-slate-800 opacity-20 transform transition-transform group-hover:scale-110 duration-700">
                        {mode === 'ui' ? <Container size={120} strokeWidth={1} /> : mode === 'replica' ? <ScanEye size={120} strokeWidth={1} /> : <Network size={120} strokeWidth={1} />}
                      </div>
                    )}
                    <div className="relative z-10 mt-8">
                      <p className="text-2xl font-black text-white mb-2 tracking-tight">Synthesis Pending</p>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto">
                        {isAnalyzing ? 'Decoding structure and interactions from source...' : 'Your generated output and documentation will populate here.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Refinement Chat Integration */}
            {showResults && (
              <RefinementChat 
                mode={mode} 
                onRefine={handleRefinement} 
                isRefining={isRefining} 
              />
            )}

            {/* Decision Trace Modal */}
            {showTrace && result && (
              <DecisionTracePanel 
                trace={result.decision_trace} 
                onClose={() => setShowTrace(false)} 
                onOverride={handleTraceOverride}
              />
            )}

            {/* Compliance Report Modal (Non-Blocking) */}
            {showComplianceModal && (
              <ViolationReport 
                violations={violations} 
                isBlocking={false}
                onClose={() => setShowComplianceModal(false)}
              />
            )}
          </section>
        </main>

        <footer className="py-24 px-6 border-t border-white/5 bg-slate-950/60 relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <Code2 size={24} className="text-sky-500" />
                <span className="font-black text-xl text-white tracking-tighter">CodeCanvas AI</span>
              </div>
              <p className="text-slate-500 text-sm italic max-w-xs text-center md:text-left leading-relaxed">
                Synthesizing the future of frontend and infrastructure from a single drawing.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-6">
               <div className="flex items-center gap-6">
                  <a href="#" onClick={handleOpenDocs} className="text-slate-400 hover:text-white transition-colors text-sm font-bold">Documentation</a>
               </div>
               <div className="mt-4 flex gap-4">
                  <a href="https://github.com/Shahood046/CodeCanvas" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"><Github size={18} /></a>
               </div>
            </div>

            <div className="text-center md:text-right">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Powered by</p>
               <div className="flex justify-center md:justify-end items-center gap-4 opacity-40">
                  <span className="text-white font-bold tracking-tighter text-lg">GEMINI 3 PRO</span>
                  <span className="text-white font-bold tracking-tighter text-lg">REACT 19</span>
               </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">© 2025 CodeCanvas Lab • Strictly Production Ready</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
