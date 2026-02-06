# Technical Capabilities & Engine Features 🧠⚡

CodeCanvas AI leverages advanced computer vision and LLM reasoning to interpret technical drawings. Here is a breakdown of the specialized capabilities within each mode.

---

## 🎨 Frontend Synthesizer (UI Mode)

The UI engine is designed to recognize user interface patterns and translate them into modular React components.

### 1. Spatial Layout Analysis
- **Grid & Flexbox Detection**: Identifies column-based layouts, sidebars, headers, and footers from drawing positions.
- **Component Mapping**: Maps hand-drawn boxes to standard UI components (Buttons, Inputs, Cards, Modals).

### 2. Dual-Output Logic
- **The Wireframe**: A high-fidelity, literal translation of the sketch. Focuses on spatial accuracy and mono-spaced aesthetics for "logic-first" validation.
- **The Production UI**: An interpreted version that adds shadows, rounded corners, sophisticated typography, and gradients based on modern design systems.

### 3. Integrated Tooling
- **Tailwind Integration**: Uses standard Tailwind utility classes for responsive, clean CSS.
- **Lucide Icon Mapping**: Intelligently replaces "icon placeholders" with relevant Lucide React icons.

---

## ⚙️ DevOps Architect (Infrastructure Mode)

The DevOps engine interprets system topology and network flow to generate infrastructure blueprints.

### 1. Node & Topology Recognition
- **Compute Recognition**: Identifies "API," "Server," and "Worker" labels to define service definitions.
- **State Persistence**: Recognizes database symbols (cylinders) and maps them to Docker volumes and persistent storage drivers.
- **Traffic Routing**: Interprets "LB" or "Gateway" boxes as Nginx/Traefik load balancer configurations.

### 2. Infrastructure-as-Code (IaC)
- **Service Orchestration**: Generates `docker-compose.yml` (v3.8) with correct `ports`, `networks`, and `environment` blocks.
- **Dependency Graphing**: Uses `depends_on` and health checks to ensure services boot in the correct order based on the arrows in your sketch.

### 3. Visual Documentation
- **Mermaid.js Translation**: Converts the structural logic into a `graph TD` Mermaid definition.
- **Semantic Shapes**: Automatically uses circles for users, boxes for services, and cylinders for databases in the graph output.

---

## 👁️ Ambiguity Exposure & Decision Trace (AEDT)

A human-in-the-loop feature that ensures transparency in AI reasoning.

- **Confidence Scoring**: Every semantic decision is scored (0.0 - 1.0). Low-confidence items (<0.7) are flagged for review.
- **Logic Inspection**: Users can expand any decision to see the "Reasoning Chain" — why the AI chose "Postgres" over "Redis" or "Grid Layout" over "Flex".
- **Correction Loop**: Provides a direct mechanism to override specific interpretations and trigger a targeted refinement of the code.

---

## 🔄 Refinement Studio

A conversational layer that allows for iterative improvements on the generated artifacts.

- **Natural Language Modifications**: Tweak styles or architecture with simple prompts like "Make the header sticky" or "Add a Redis replica".
- **Synchronized DevOps Updates**: In Infrastructure Mode, refining the code automatically updates BOTH the `docker-compose.yml` and the Mermaid visual diagram, ensuring documentation never drifts from the implementation.
- **Context-Aware Parsing**: The engine differentiates between stylistic UI changes and structural infrastructure changes.

---

## 🤖 Core Engine (Gemini 3 Pro)

- **Handwriting OCR**: High-accuracy recognition of technical scribbles and messy labels.
- **Contextual Inference**: If a database is mentioned but not specified, the engine defaults to industry standards (e.g., PostgreSQL or Redis) based on the surrounding architecture.
- **Smart Caching**: Implements a robust storage strategy that prioritizes code retention over heavy image assets when local storage quotas are met.
- **Zero-Latency Preview**: Real-time rendering of synthesized React code within an isolated sandbox.