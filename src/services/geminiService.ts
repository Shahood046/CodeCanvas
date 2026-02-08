import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult, AppMode } from "../types";
import { AVAILABLE_CONSTRAINTS } from "./constraintService";

// --- Configuration ---

// Model hierarchy using only VALID, WORKING model names
const MODEL_HIERARCHY = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",           // Fast and efficient
  "gemini-1.5-flash",           // Stable fallback  
  "gemini-1.5-pro"              // High quality fallback (use sparingly due to quota)
];

// --- Key Management Helper ---
// This specifically fixes the "VITE_API_KEYS" mismatch
const getAPIKey = (): string => {
  const keysEnv = import.meta.env.VITE_API_KEY;
  if (!keysEnv) {
    console.error("❌ MISSING KEY: VITE_API_KEYS is missing from .env");
    throw new Error("Missing API Key");
  }
  
  // Handle multiple keys if you have them (comma separated)
  const keys = keysEnv.split(',').map((k: string) => k.trim());
  
  // Simple random rotation to avoid rate limits
  return keys[Math.floor(Math.random() * keys.length)];
};

// --- System Prompts ---

const UI_SYSTEM_PROMPT = `
You are a Strict, Deterministic Frontend Architect. Your task is to generate TWO distinct versions of the attached UI sketch in a single JSON response.

GLOBAL ANTI-HALLUCINATION RULES:
1. DO NOT invent features (e.g., do not add a "Search Bar" or "User Profile" unless explicitly drawn).
2. DO NOT invent specific marketing copy. If text is illegible, use "Label" or "Heading".
3. STRICT ADHERENCE: If a box is empty, render it empty. Do not guess what goes inside.

REACT BEST PRACTICES (CRITICAL):
1. **UNIQUE KEYS (MANDATORY):** When using .map(), YOU MUST provide a unique 'key' prop.
   - Arrays of components: key={item.id} or key={\`item-\${index}\`}
   - SVG children in loops: key={\`rect-\${i}\`}, key={\`path-\${idx}\`}
   - Example: {items.map((item, i) => <div key={item.id}>...</div>)}
   - Example: {[...Array(5)].map((_, i) => <rect key={\`bar-\${i}\`} />)}
   - ❌ NEVER forget keys in ANY .map() - React will throw warnings!
2. **NO <img> ERRORS:** Use this exact placeholder format for ALL images:
   "https://placehold.co/WIDTHxHEIGHT/png?text=Label"
   (e.g. "https://placehold.co/100x100/png?text=Avatar")
3. **SVG ELEMENTS:** If generating charts/graphs with loops, ALWAYS add key prop to rect, circle, path, etc.
4. **LUCIDE ICONS (CRITICAL):** ONLY use icons you explicitly import. Common icons to import:
   \`import { Search, Menu, X, ChevronDown, User, Settings, Bell, Home, Calendar, TrendingUp, BarChart, Heart, Star, Filter, Plus, Minus, Edit, Trash2, Check, AlertCircle } from 'lucide-react';\`
   - ❌ NEVER use an icon without importing it first
   - ❌ DO NOT use UsersIcon, SearchIcon, etc. - use User, Search (without Icon suffix)
   - ✅ Correct: <Search className="w-4 h-4" />
   - ❌ Wrong: <SearchIcon /> or <UsersIcon />

INSTRUCTIONS FOR "wireframe_code":
1. Goal: Literal, pixel-perfect translation of the sketch.
2. Style: Brutalist Wireframe (bg-white, border-2 border-black, font-mono).
3. Structure: Single file React component using Tailwind CSS.
4. INTERACTIVITY (MANDATORY):
   - Search inputs: Add useState and onChange handlers that filter data
   - Navigation: Add useState for active page/tab, update on click
   - Forms: All inputs must be controlled components with state
   - Buttons: Add onClick handlers (even if just console.log for now)
   - Dropdowns/Modals: Add show/hide state with proper toggling
5. CRITICAL: 
   - You MUST export a single component named 'App' as the default export.
   - ALWAYS start with: import React, { useState, useMemo, useCallback } from 'react';
   - Import ALL icons you use: import { Search, Menu, X, ChevronDown, User, Settings, Bell, Home, Calendar, TrendingUp, BarChart, Heart, Star, Filter, Plus, Edit, Trash2, Check } from 'lucide-react';
   - ❌ DO NOT use UsersIcon, SearchIcon - use User, Search without Icon suffix

INSTRUCTIONS FOR "modern_code":
1. Goal: A polished, FULLY INTERACTIVE production-ready implementation of *exactly* what is drawn.
2. Style: Modern SaaS (rounded-xl, subtle shadows, proper whitespace).
3. CONSTRAINT: You may upgrade the *style* (font, color, shadow), but you MUST NOT add *content* or *components* that are missing from the input.

4. MANDATORY INTERACTIVE FEATURES:
   ✅ **Search/Filter Inputs:**
   - useState for search query: const [searchQuery, setSearchQuery] = useState('');
   - onChange handler that updates state
   - useMemo to filter displayed data based on query
   - Example: const filtered = useMemo(() => data.filter(item => item.name.includes(searchQuery)), [data, searchQuery]);

   ✅ **Navigation/Tabs:**
   - useState for active page: const [activePage, setActivePage] = useState('home');
   - onClick handlers that update active state
   - Conditional rendering or CSS classes based on active state
   - Example: className={\`...\${activePage === 'home' ? 'bg-blue-600' : 'bg-gray-200'}\`}

   ✅ **Charts/Graphs:**
   - If chart shown, generate with dynamic data points
   - Data should be in state or constants array
   - Use .map() to generate SVG paths/bars/points from data
   - Example: {chartData.map((value, i) => <rect key={\`bar-\${i}\`} x={i*20} height={value} />)}

   ✅ **Status Badges/Labels:**
   - Create color mapping object for different statuses
   - Example: const statusColors = { Active: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100' };
   - Apply dynamically: className={statusColors[item.status]}

   ✅ **Forms:**
   - All <input>, <select>, <textarea> must be controlled components
   - Add value and onChange props
   - Example: <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />

   ✅ **Dropdowns/Menus:**
   - useState for open/close: const [isOpen, setIsOpen] = useState(false);
   - Toggle on click: onClick={() => setIsOpen(!isOpen)}
   - Conditional rendering: {isOpen && <div>...</div>}

   ✅ **Table Sorting (if table present):**
   - Add onClick to table headers
   - Sort data based on clicked column
   - Show sort direction indicator (▲/▼)

5. CRITICAL: 
   - You MUST export a single component named 'App' as the default export.
   - ALWAYS start with: import React, { useState, useMemo, useCallback } from 'react';
   - Import ALL icons you use: import { Search, Menu, X, ChevronDown, User, Settings, Bell, Home, Calendar, TrendingUp, BarChart, Heart, Star, Filter, Plus, Edit, Trash2, Check } from 'lucide-react';
   - ❌ DO NOT use UsersIcon, SearchIcon - use User, Search without Icon suffix
   - ALL interactive elements must have working state management
   - Add useCallback for event handlers passed to components
   - Add useMemo for expensive filtering/sorting operations

6. COMPLETE INTERACTIVE EXAMPLE (Reference Pattern):
\`\`\`javascript
import React, { useState, useMemo, useCallback } from 'react';

const App = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState('home');
  const [sortBy, setSortBy] = useState('name');
  
  // Mock data
  const data = [
    { id: 1, name: 'Item A', status: 'Active' },
    { id: 2, name: 'Item B', status: 'Pending' }
  ];
  
  // Status color mapping
  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Inactive: 'bg-gray-100 text-gray-600'
  };
  
  // Filtered & sorted data (performance optimized)
  const displayData = useMemo(() => {
    return data
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }, [data, searchQuery, sortBy]);
  
  // Event handlers
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);
  
  return (
    <div>
      <input value={searchQuery} onChange={handleSearch} />
      <nav>
        <button 
          onClick={() => setActivePage('home')}
          className={\`\${activePage === 'home' ? 'bg-blue-600' : 'bg-gray-200'}\`}
        >
          Home
        </button>
      </nav>
      <table>
        <tbody>
          {displayData.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <span className={\`px-2 py-1 rounded \${statusColors[item.status]}\`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
\`\`\`
THIS IS THE MINIMUM STANDARD. Every interactive element MUST follow this pattern.

INSTRUCTIONS FOR "decision_trace" (Ambiguity Exposure):
1. Identify 3-5 elements where the drawing was unclear.
2. For each, provide:
   - 'element_id': Unique ID.
   - 'element_type': 'ui_component' or 'layout'.
   - 'raw_label': What it looks like (e.g., "Squiggly line next to box").
   - 'possible_interpretations': ["Search Icon", "Menu Icon", "Logo"].
   - 'chosen_interpretation': The choice you made.
   - 'confidence': 0.0 to 1.0.
   - 'reasoning': Why you chose this (e.g., "Position suggests it is a logo").
   - 'overridable': true.

OUTPUT: JSON with wireframe_code, wireframe_explanation, modern_code, modern_explanation, decision_trace.
`;

const DEVOPS_SYSTEM_PROMPT = `
You are a DevOps Architect. Convert the architectural drawing into Infrastructure-as-Code.

CRITICAL INSTRUCTION: You must generate TWO different formats in the JSON output.
1. "mermaid_diagram": A visual graph code (NOT YAML).
2. "docker_compose": The actual implementation code (YAML).

RULES for "mermaid_diagram" (CRITICAL SYNTAX):
- MUST start with "graph TD" or "flowchart TD".
- Use ONLY alphanumeric IDs (no spaces, no special chars): user, uploadAPI, s3Storage, queue, worker, postgresDB.
- Node labels MUST use square brackets: A[Label Text].
- NEVER use parentheses () inside labels - they break Mermaid syntax. Instead of "Queue (RabbitMQ)", use "RabbitMQ Queue" or "Queue - RabbitMQ".
- NEVER use forward slashes / inside labels - they break syntax. Instead of "S3/Storage", use "S3 Storage".
- Arrows: Use --> for connections.
- VALID Example:
  graph TD
    user[User Upload] --> uploadAPI[Upload API]
    uploadAPI --> s3[S3 Storage]
    uploadAPI --> queue[RabbitMQ Queue]
    queue --> worker[Worker Service]
    worker --> db[Postgres DB]
- INVALID EXAMPLES (DO NOT DO THIS):
  ❌ queue[Queue (RabbitMQ)]  -- Breaks due to parentheses
  ❌ s3[S3/Storage]  -- Breaks due to forward slash
  ✅ queue[RabbitMQ Queue]  -- Correct
  ✅ s3[S3 Storage]  -- Correct
- DO NOT use markdown code blocks (\`\`\`) inside the string.

RULES for "docker_compose":
- Standard Docker Compose v3.8.
- Map the drawn boxes to images (e.g., "DB" -> "postgres", "Queue" -> "rabbitmq").
- Don't invent services like Nginx unless drawn.

OUTPUT JSON STRUCTURE:
{
  "mermaid_diagram": "string (The graph code)",
  "docker_compose": "string (The YAML code)",
  "explanation": "string",
  "decision_trace": []
}
`;
const REPLICA_SYSTEM_PROMPT = `
You are a Production-Grade Visual Reverse Engineer specializing in pixel-perfect UI reconstruction.
Generate enterprise-ready React code with full interactivity, accessibility, and performance optimizations.

⚠️ CRITICAL OUTPUT FORMAT: You MUST return ONLY a valid JSON object. Do NOT return raw code. Do NOT add explanatory text.

═════════════════════════════════════════════════════════════════
SECTION 1: PRODUCTION-READY CODE STANDARDS
═════════════════════════════════════════════════════════════════

✅ FUNCTIONAL INTERACTIONS (MANDATORY - EVERY ELEMENT MUST BE INTERACTIVE):

1. **Search/Filter Inputs (CRITICAL):**
   - MUST use <input> elements with value and onChange, NOT <button> elements
   - Add useState: const [searchQuery, setSearchQuery] = useState('');
   - Add onChange: onChange={(e) => setSearchQuery(e.target.value)}
   - Filter data with useMemo: const filtered = useMemo(() => data.filter(item => item.name.includes(searchQuery)), [data, searchQuery]);
   - Example:
   \`\`\`javascript
   const [search, setSearch] = useState('');
   const filtered = useMemo(() => 
     listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase())),
     [listings, search]
   );
   <input value={search} onChange={(e) => setSearch(e.target.value)} />
   \`\`\`

2. **Category/Tab Filters (CRITICAL):**
   - Add useState: const [activeCategory, setActiveCategory] = useState('all');
   - Add onClick: onClick={() => setActiveCategory('homes')}
   - Apply active styling: className={\`...\${activeCategory === 'homes' ? 'border-black text-black' : 'border-transparent text-gray-500'}\`}
   - Filter data based on active category
   - Example:
   \`\`\`javascript
   const [activeTab, setActiveTab] = useState('homes');
   const filteredByCategory = useMemo(() => 
     data.filter(item => activeTab === 'all' || item.category === activeTab),
     [data, activeTab]
   );
   {categories.map(cat => (
     <button 
       key={cat.id}
       onClick={() => setActiveTab(cat.id)}
       className={\`\${activeTab === cat.id ? 'border-b-2 border-black' : ''}\`}
     >
       {cat.label}
     </button>
   ))}
   \`\`\`

3. **Wishlist/Like Buttons (CRITICAL):**
   - Add useState: const [wishlist, setWishlist] = useState([]);
   - Toggle handler: const toggleWishlist = useCallback((id) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);
   - Visual feedback: fill={wishlist.includes(item.id) ? '#FF385C' : 'none'}
   - Pass handler to child components with useCallback

4. **Dropdown/Menu Toggles (CRITICAL):**
   - Add useState: const [isMenuOpen, setIsMenuOpen] = useState(false);
   - Toggle on click: onClick={() => setIsMenuOpen(!isMenuOpen)}
   - Conditional render: {isMenuOpen && <div className="absolute...">...</div>}
   - Add click-outside detection:
   \`\`\`javascript
   const menuRef = useRef(null);
   useEffect(() => {
     const handleClickOutside = (e) => {
       if (menuRef.current && !menuRef.current.contains(e.target)) {
         setIsMenuOpen(false);
       }
     };
     if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isMenuOpen]);
   \`\`\`

5. **Navigation/Page Routing (CRITICAL):**
   - For multi-section layouts, use URL hash: onClick={() => window.location.hash = '#about'}
   - Or use state: const [currentPage, setCurrentPage] = useState('home');
   - Conditional rendering based on active page

6. **Form Control (CRITICAL):**
   - ALL form inputs MUST be controlled components
   - Pattern: <input value={formData.field} onChange={(e) => setFormData({...formData, field: e.target.value})} />
   - Add form validation state if form shown

7. **Mobile Hamburger Menus (CRITICAL):**
   - Add useState: const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   - Implement with transform: className={\`transform transition-transform \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}\`}
   - Add overlay: {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />}

8. **Toggle Switches (CRITICAL):**
   - Add useState: const [isEnabled, setIsEnabled] = useState(false);
   - Visual toggle: className={\`\${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}\`}
   - Animated slider: <div className={\`transform transition-transform \${isEnabled ? 'translate-x-5' : 'translate-x-0'}\`} />

9. **Color-Coded Status Badges (CRITICAL):**
   - Create mapping object:
   \`\`\`javascript
   const statusColors = {
     Active: 'bg-green-100 text-green-700 border-green-200',
     Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
     Completed: 'bg-blue-100 text-blue-700 border-blue-200',
     Failed: 'bg-red-100 text-red-700 border-red-200'
   };
   <span className={\`px-2 py-1 rounded \${statusColors[item.status] || 'bg-gray-100'}\`}>
     {item.status}
   </span>
   \`\`\`

10. **Table Sorting (if table present):**
    - Add state: const [sortBy, setSortBy] = useState('name'); const [sortDir, setSortDir] = useState('asc');
    - Sort handler: onClick={() => setSortBy('name')}
    - Sort data: const sorted = useMemo(() => [...data].sort((a,b) => sortDir === 'asc' ? a[sortBy].localeCompare(b[sortBy]) : b[sortBy].localeCompare(a[sortBy])), [data, sortBy, sortDir]);
    - Show indicator: {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}

✅ DATA STRUCTURE PATTERNS:
- Use typed arrays of objects, not keyed objects
- Example: const sections = [{ id: 1, title: "...", items: [...] }]
- Include realistic data volume (6-12 items per section minimum)
- All IDs must be unique for proper React keys

✅ PERFORMANCE OPTIMIZATIONS:
1. Add loading="lazy" to all <img> tags
2. Use CSS transitions instead of JavaScript animations where possible
3. Implement useMemo for expensive computations
4. Use useCallback for event handlers passed to child components
5. Add proper key props in all .map() loops

✅ ACCESSIBILITY (A11Y) REQUIREMENTS:
1. All interactive elements must have aria-label or aria-labelledby
2. Use semantic HTML: <nav>, <main>, <header>, <footer>, <section>, <article>
3. Ensure keyboard navigation works (tabIndex where needed)
4. Add alt text to all images (descriptive, not just "image")
5. Color contrast must meet WCAG AA standards
6. Focus states on all interactive elements (ring classes)

✅ RESPONSIVE DESIGN:
1. Use Tailwind breakpoints consistently: sm:, md:, lg:, xl:, 2xl:
2. Mobile-first approach (base styles are mobile, add breakpoints for larger)
3. Hidden elements on mobile must use hidden md:block pattern
4. Touch-friendly hit areas (min 44x44px for buttons)

═════════════════════════════════════════════════════════════════
SECTION 2: CONTENT & VISUAL FIDELITY
═════════════════════════════════════════════════════════════════

🎯 TRANSCRIPTION RULES:
1. Copy visible text EXACTLY (no Lorem Ipsum unless that's what's shown)
2. Preserve brand colors precisely (extract hex codes from video)
3. Match font weights, sizes, and spacing
4. Replicate border radius and shadow values

🖼️ IMAGE HANDLING:
1. Format: "https://placehold.co/WIDTHxHEIGHT/HEXCOLOR/TEXTHEX?text=Descriptive+Label"
   Example: "https://placehold.co/600x400/E5E7EB/1F2937?text=Mountain+Cabin"
2. Use appropriate dimensions (product cards: 400x300, hero: 1920x1080)
3. Add descriptive alt text matching visible content

═════════════════════════════════════════════════════════════════
SECTION 3: REACT ARCHITECTURE
═════════════════════════════════════════════════════════════════

🏗️ COMPONENT EXTRACTION:
Extract reusable components for:
- Card items (ProductCard, ListingCard, etc.)
- Form inputs (SearchBar, FilterDropdown)
- Navigation elements (NavLink, MobileMenu)
- Modal/Dialog overlays

🔄 STATE MANAGEMENT PATTERNS:
\`\`\`javascript
// Search state
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({ category: 'all', priceRange: [0, 1000] });

// UI state
const [activeTab, setActiveTab] = useState('home');
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

// Derived/Computed state
const filteredItems = useMemo(() => 
  items.filter(item => item.category === filters.category), 
  [items, filters]
);
\`\`\`

🎨 TAILWIND UTILITY PATTERNS:
- Hover states: hover:bg-gray-100 hover:scale-105 transition duration-200
- Focus states: focus:outline-none focus:ring-2 focus:ring-blue-500
- Active states: active:scale-95
- Disabled states: disabled:opacity-50 disabled:cursor-not-allowed
- Dark mode (if shown): dark:bg-gray-800 dark:text-white

📚 COMPLETE INTERACTIVE EXAMPLE (MANDATORY REFERENCE):
\`\`\`javascript
const App = () => {
  // 1. Search with useMemo filtering
  const [searchQuery, setSearchQuery] = useState('');
  const filteredListings = useMemo(() => 
    listings.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  // 2. Category navigation with active state
  const [activeCategory, setActiveCategory] = useState('all');
  const categories = ['all', 'homes', 'apartments', 'villas'];
  
  // 3. Wishlist toggle with useCallback
  const [wishlist, setWishlist] = useState([]);
  const toggleWishlist = useCallback((id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // 4. Status color mapping
  const statusColors = {
    available: 'bg-green-100 text-green-700',
    booked: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700'
  };

  // 5. Form data for booking
  const [bookingForm, setBookingForm] = useState({ guests: 1, checkIn: '', checkOut: '' });
  
  // 6. Dropdown toggle with click-outside
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  return (
    <div>
      {/* Interactive Search */}
      <input 
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search listings..."
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Category Navigation */}
      <div className="flex gap-4 my-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={\`px-4 py-2 rounded \${activeCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}\`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listings Grid with Wishlist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredListings.map(listing => (
          <div key={listing.id} className="border rounded-lg overflow-hidden">
            <img src={listing.image} alt={listing.title} loading="lazy" />
            <div className="p-4">
              <h3>{listing.title}</h3>
              <span className={\`px-2 py-1 rounded text-sm \${statusColors[listing.status]}\`}>
                {listing.status}
              </span>
              <button
                onClick={() => toggleWishlist(listing.id)}
                className="mt-2"
                aria-label="Add to wishlist"
              >
                <Heart 
                  className="w-6 h-6" 
                  fill={wishlist.includes(listing.id) ? '#FF385C' : 'none'}
                  stroke={wishlist.includes(listing.id) ? '#FF385C' : 'currentColor'}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dropdown Filter */}
      <div ref={filterRef} className="relative">
        <button onClick={() => setIsFilterOpen(!isFilterOpen)}>
          Filters
        </button>
        {isFilterOpen && (
          <div className="absolute top-full mt-2 bg-white shadow-lg rounded-lg p-4">
            <label>Price Range</label>
            <input type="range" min="0" max="1000" />
          </div>
        )}
      </div>

      {/* Controlled Form */}
      <form className="mt-8 space-y-4">
        <input 
          type="number"
          value={bookingForm.guests}
          onChange={(e) => setBookingForm({...bookingForm, guests: e.target.value})}
          placeholder="Number of guests"
          className="w-full px-4 py-2 border rounded"
        />
        <input 
          type="date"
          value={bookingForm.checkIn}
          onChange={(e) => setBookingForm({...bookingForm, checkIn: e.target.value})}
          className="w-full px-4 py-2 border rounded"
        />
      </form>
    </div>
  );
};
\`\`\`

═════════════════════════════════════════════════════════════════
SECTION 4: TESTING STRATEGY
═════════════════════════════════════════════════════════════════

Generate comprehensive test_code covering:
1. **Component Rendering**: All major sections render without crashing
2. **Interactive Elements**: Buttons, inputs, and filters are functional
3. **State Changes**: Category filters update displayed items
4. **User Events**: Click, input, and keyboard events work correctly
5. **Accessibility**: aria labels exist, semantic HTML is used

Test structure:
\`\`\`javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders main navigation', () => { ... });
  test('search input filters results', () => { ... });
  test('category buttons change active state', () => { ... });
  test('card elements are keyboard accessible', () => { ... });
});
\`\`\`

═════════════════════════════════════════════════════════════════
SECTION 5: OUTPUT JSON STRUCTURE
═════════════════════════════════════════════════════════════════

{
  "code": "Full React component as string (3000+ lines for complex UIs)",
  "test_code": "Complete Jest/RTL test suite as string (500+ lines)",
  "explanation": "Brief technical summary (e.g., 'E-commerce listing page with functional search, filters, and responsive grid layout')",
  "fidelity_report": {
    "component_count": <number of extracted components>,
    "detected_interactions": ["search", "category filter", "like button", "modal trigger"],
    "accessibility_check": "WCAG AA compliant - semantic HTML, aria labels, keyboard nav"
  },
  "decision_trace": []
}

⚠️ FINAL REMINDERS:
- Return ONLY JSON (no preamble text)
- All interactions must be FUNCTIONAL, not decorative
- Code must run without errors in a modern React environment
- Export 'App' as default
- Use lucide-react for icons
`
;

// --- Helpers ---

const cleanCodeBlock = (code: string | undefined): string => {
  if (typeof code !== 'string') return "";
  return code.replace(/^```[\w-]*\n/gm, '').replace(/```$/gm, '').trim();
};

const extractJSON = (text: string): string => {
  try {
    // First, try to find JSON code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }
    
    // Look for the first occurrence of {" to find the start of a JSON object
    // This avoids matching destructuring like "{ useState, useEffect }"
    const jsonStart = text.search(/\{\s*["']/);
    if (jsonStart !== -1) {
      const lastClose = text.lastIndexOf('}');
      if (lastClose > jsonStart) {
        return text.substring(jsonStart, lastClose + 1);
      }
    }
    
    // Fallback to original logic
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
    }
    
    return text;
  } catch (e) {
    return text;
  }
};

// --- Execution Engine (Robust Fallback) ---

// JSON Schema for structured output
const REPLICA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    code: { type: "string", description: "Complete React component code" },
    test_code: { type: "string", description: "Jest/RTL test suite" },
    explanation: { type: "string", description: "Brief layout summary" },
    fidelity_report: {
      type: "object",
      properties: {
        component_count: { type: "number" },
        detected_interactions: { type: "array", items: { type: "string" } },
        accessibility_check: { type: "string" }
      },
      required: ["component_count", "detected_interactions", "accessibility_check"]
    },
    decision_trace: { 
      type: "array", 
      items: { 
        type: "object",
        properties: {
          element_id: { type: "string" },
          element_type: { type: "string" },
          raw_label: { type: "string" },
          possible_interpretations: { type: "array", items: { type: "string" } },
          chosen_interpretation: { type: "string" },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          overridable: { type: "boolean" }
        },
        required: ["element_id", "element_type", "chosen_interpretation"]
      }
    }
  },
  required: ["code", "test_code", "explanation", "fidelity_report", "decision_trace"]
};

async function executeWithFallback(
  operation: (model: any, modelName: string) => Promise<any>,
  useSchema: boolean = false
): Promise<any> {
  let lastError: any = null;

  for (const modelName of MODEL_HIERARCHY) {
    try {
      console.log(`[Gemini Service] Attempting execution with model: ${modelName}`);
      
      // FIX: Use our new local helper that reads YOUR specific .env variable
      const apiKey = getAPIKey(); 

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Build generation config
      const generationConfig: any = {
        temperature: 0.1,
        responseMimeType: "application/json"
      };
      
      // Add schema for structured outputs if needed
      if (useSchema) {
        generationConfig.responseSchema = REPLICA_RESPONSE_SCHEMA;
      }
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig
      });
      
      return await operation(model, modelName);

    } catch (error: any) {
      const msg = error?.message || error?.toString() || "";
      console.warn(`[Gemini Service] Model '${modelName}' failed:`, msg);
      lastError = error;

      if (modelName === MODEL_HIERARCHY[MODEL_HIERARCHY.length - 1]) {
         break;
      }
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

// --- Exported Functions ---

export const analyzeImage = async (
  base64Image: string, 
  mode: AppMode, 
  additionalInstructions?: string, 
  activeConstraints: string[] = []
): Promise<AnalysisResult> => {
  
  const mimeMatch = base64Image.match(/^data:(.*?);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'; 
  const base64Data = base64Image.replace(/^data:.*?;base64,/, "");

  let promptText = "";
  if (mode === 'ui') promptText = UI_SYSTEM_PROMPT;
  else if (mode === 'devops') promptText = DEVOPS_SYSTEM_PROMPT;
  else if (mode === 'replica') promptText = REPLICA_SYSTEM_PROMPT;

  if (activeConstraints.length > 0) {
      const constraintList = AVAILABLE_CONSTRAINTS
        .filter(c => activeConstraints.includes(c.id) && c.mode === mode)
        .map(c => `- ${c.label}: ${c.description}`)
        .join('\n');
      if (constraintList) promptText += `\n\nCRITICAL CONSTRAINTS:\n${constraintList}`;
  }

  const fullPrompt = additionalInstructions 
    ? `${promptText}\n\nUSER DIRECTIVES: ${additionalInstructions}` 
    : promptText;

  // Use schema for replica mode to ensure proper JSON structure
  const useSchema = mode === 'replica';

  return executeWithFallback(async (model) => {
    const result = await model.generateContent([
        fullPrompt,
        { inlineData: { mimeType: mimeType, data: base64Data } }
    ]);
    
    const response = await result.response;
    const text = extractJSON(response.text());
    
    try {
        const parsed = JSON.parse(text);
        const trace = Array.isArray(parsed.decision_trace) ? parsed.decision_trace : [];

        if (mode === 'ui') {
            return {
                wireframe_code: cleanCodeBlock(parsed.wireframe_code),
                wireframe_explanation: parsed.wireframe_explanation || "Generated",
                modern_code: cleanCodeBlock(parsed.modern_code),
                modern_explanation: parsed.modern_explanation || "Generated",
                decision_trace: trace
            };
        } else if (mode === 'replica') {
            return {
                code: cleanCodeBlock(parsed.code),
                test_code: cleanCodeBlock(parsed.test_code),
                explanation: parsed.explanation || "Generated",
                fidelity_report: parsed.fidelity_report,
                decision_trace: trace
            };
        } else {
            return {
                docker_compose: cleanCodeBlock(parsed.docker_compose),
                mermaid_diagram: cleanCodeBlock(parsed.mermaid_diagram),
                explanation: parsed.explanation || "Generated",
                decision_trace: trace
            };
        }
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.log("Raw Text:", text);
        console.log("Extracted JSON attempt:", text.substring(0, 500));
        throw new Error(`AI generated invalid JSON. The response may have been raw code instead of a JSON object. Error: ${(parseError as Error).message}`);
    }
  }, useSchema);
};

export const refineCode = async (currentCode: string, mode: AppMode, instruction: string): Promise<string> => {
  let systemPrompt = "";
  let userPrompt = "";

  if (mode === 'ui') {
    systemPrompt = `You are a Strict React/Tailwind developer. Modify the code based on the user's request. 
    
CRITICAL OUTPUT FORMAT: Return ONLY the complete, executable React component code. Do NOT wrap it in JSON. Do NOT add explanatory text.
- Start directly with: import React...
- MUST include: function App() { ... }
- End with: export default App;
- STRICTNESS: Do NOT add unrelated components. Export 'App' as default.

Example structure:
import React, { useState } from 'react';

function App() {
  return <div>...</div>;
}

export default App;`;
    userPrompt = `CURRENT CODE:\n${currentCode}\n\nUSER INSTRUCTION:\n${instruction}\n\nReturn ONLY the modified code, no JSON, no explanations.`;
  } else if (mode === 'replica') {
    systemPrompt = `You are a Visual Replica Engineer. Modify the code. Maintain pixel-perfect layout. Export 'App' as default.
    
CRITICAL OUTPUT FORMAT: Return ONLY the complete, executable React component code. Do NOT wrap it in JSON. Do NOT add explanatory text.
- Start directly with: import React...
- MUST include: function App() { ... }
- End with: export default App;

Example structure:
import React, { useState } from 'react';

function App() {
  return <div>...</div>;
}

export default App;`;
    userPrompt = `CURRENT CODE:\n${currentCode}\n\nUSER INSTRUCTION:\n${instruction}\n\nReturn ONLY the modified code, no JSON, no explanations.`;
  } else {
    systemPrompt = "You are a Senior DevOps engineer. Modify the infrastructure. Update BOTH docker-compose and Mermaid. Return JSON object.";
    userPrompt = `CURRENT CONFIG (JSON):\n${currentCode}\n\nUSER INSTRUCTION:\n${instruction}`;
  }

  return executeWithFallback(async (model) => {
    const result = await model.generateContent([
        systemPrompt,
        userPrompt
    ]);

    const response = await result.response;
    let text = response.text();
    
    if (mode === 'devops') {
        text = extractJSON(text.replace(/```json/g, '').replace(/```/g, ''));
    } else {
        // For UI and replica modes, extract code properly
        text = text.trim();
        
        // Remove markdown code blocks if present
        text = text.replace(/```(?:jsx?|tsx?|javascript|typescript|react)?\n/g, '').replace(/```$/g, '').trim();
        
        // Check if AI returned JSON despite instructions
        try {
          if (text.startsWith('{') && text.includes('"code"')) {
            const parsed = JSON.parse(text);
            if (parsed.code) {
              text = parsed.code;
            }
          }
        } catch (e) {
          // Not JSON, continue with raw text
        }
        
        // Validate that App component exists
        const hasAppFunction = /function\s+App\s*\(/.test(text);
        const hasAppArrow = /const\s+App\s*=.*=>\s*{/.test(text) || /const\s+App\s*=.*=>\s*\(/.test(text);
        const hasDefaultExport = /export\s+default\s+App/.test(text);
        
        if (!hasAppFunction && !hasAppArrow) {
          console.error('[Refinement] AI returned code without App component. Falling back to original.');
          throw new Error('AI returned invalid code without App component');
        }
        
        // Ensure export default App exists
        if (!hasDefaultExport) {
          if (!text.trim().endsWith('export default App;')) {
            text = text.trim() + '\n\nexport default App;';
          }
        }
    }
    
    return cleanCodeBlock(text);
  });
};