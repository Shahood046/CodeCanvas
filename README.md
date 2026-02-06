CodeCanvas AI: The Blueprint-to-Code Synthesizer
CodeCanvas AI is a dual-mode engineering tool that bridges the gap between conceptual sketches and production-ready implementation. Powered by Gemini 3 Pro Vision, it targets a specific failure point in modern development: translating informal whiteboard sketches into deterministic, executable artifacts without manual re-implementation.

🚀 The Problem
Engineers routinely design systems using informal sketches. These are usually:

Ambiguous: "Is that a load balancer or a database?"

Non-standardized: Mixed handwriting and symbols.

Disconnected: The sketch rots on the whiteboard while the code drifts away.

Existing tools either stop at UI mockups or require strict, slow diagramming syntax. CodeCanvas is the first system that understands free-form technical sketches and converts them into real implementation artifacts.

⚡ Dual-Mode Synthesis
CodeCanvas operates as a constrained multimodal compiler with two explicit synthesis modes:

1️⃣ Frontend Synthesizer (UI Mode)
Goal: Convert informal UI sketches into structurally correct React components.

The Pipeline:

Spatial Parsing: Gemini extracts relative positions, groupings, and hierarchy (Grid vs. Flex).

Component Inference: Bounding boxes are mapped to semantic roles (e.g., <Card>, <Modal>).

Deterministic Emission: Generates React 19 functional components with Tailwind CSS.

Outputs:

Wireframe Build: A literal, brutalist translation to verify layout correctness.

Modern Production Build: A "Glow Up" version with design-system-aware styling (shadows, gradients, radius).

2️⃣ DevOps Architect (Infrastructure Mode)
Goal: Convert system topology diagrams into executable Infrastructure-as-Code (IaC).

The Pipeline:

Topology Extraction: Recognizes services (boxes), storage (cylinders), and data flow (arrows).

Semantic Mapping: Resolves ambiguous labels (e.g., maps "S3" label → minio container for local dev).

Graph Construction: Builds a directed dependency graph to ensure correct startup order.

Outputs:

Docker Compose: A valid docker-compose.yml (v3.8) with correct networks, volumes, and health checks.

Live Topology: A synchronized Mermaid.js graph that visualizes the infrastructure logic.

🛠️ Key Technical Features
🧠 Multimodal Reasoning (Gemini 3 Pro)
We do not use Gemini as a generic code generator. We use it for Joint Reasoning. It analyzes spatial layout and handwritten text simultaneously to resolve ambiguity (e.g., choosing Redis vs. Postgres based on data flow semantics) where standard OCR fails.

🔄 Refinement Studio (Stateful Iteration)
Refinement is not a free-form chat; it is a constrained modification layer.

User: "Scale the worker service to 3 replicas."

System: Updates docker-compose.yml AND the visual Mermaid diagram simultaneously.

Result: Code and Documentation never diverge.

👁️ Ambiguity Exposure & Decision Trace (AEDT)
A "Transparency Layer" that exposes the AI's internal reasoning chain.

Ambiguity Detection: Identifies unclear inputs (e.g., messy text, ambiguous icons).

Logic Exposure: Shows *why* a decision was made (e.g., "Interpreted 'db' as PostgreSQL because of the relationship with the API service").

Override Capability: Allows engineers to correct low-confidence interpretations and trigger a re-synthesis.

⚡ The "Browser Build" Engine
We solved the "Browser Import Paradox."

Challenge: Browsers cannot run raw React/ESM imports (like lucide-react) without a build step.

Solution: We built a custom Sanitization & Proxy Layer that strips incompatible imports and injects a Mock Proxy for icons. This allows the AI to hallucinate any icon library, and the Live Preview renders a placeholder instead of crashing.

🏎️ Quick Start
Upload: Drop a photo of your UI wireframe or System Architecture diagram.

Select Mode: Toggle between Frontend or DevOps architect.

Synthesize: Watch Gemini decompose your image into code and visuals.

Review Trace: Check the Decision Trace for low-confidence interpretations.

Refine: Use the chat interface to tweak the design or scale the infrastructure.

Deploy: Copy the tsx or docker-compose.yml directly to your IDE.

💻 Tech Stack
AI Engine: Google Gemini 3 Pro Vision

Frontend: React 19 + TypeScript

Styling: Tailwind CSS

Infrastructure: Docker Compose v3.8 + Mermaid.js

Runtime: Client-side Babel Transpiler (No backend build server required)

Built with ❤️ for architects and engineers who think in sketches and build for production.