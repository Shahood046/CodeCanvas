# 📘 CodeCanvas AI — Technical Documentation

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
4. **QA Sentinel**: Automated generation of `App.test.tsx` to verify the output matches the input intent.

## 5. QA Sentinel (Verification Layer)
Exists to answer: *"Is this output production-ready?"*
CodeCanvas does not aim for 100% test coverage. It enforces **Minimum Engineering Correctness**:
- **Structural Sanity**: Does the Navbar actually exist?
- **Interaction Validation**: Do buttons fire events? Do inputs accept text?
- **Accessibility (A11y)**: Are aria-labels and roles present?

## 6. The Browser Build Engine
**The Problem**: Browsers cannot execute raw ESM imports (like `import { Home } from 'lucide-react'`) directly.
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
