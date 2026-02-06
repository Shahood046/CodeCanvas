
import { AppMode, Constraint, Violation } from '../types';

export const AVAILABLE_CONSTRAINTS: Constraint[] = [
  // UI Constraints
  {
    id: 'no-inline-styles',
    label: 'No Inline Styles',
    description: 'Forbids use of style={{ ... }} in React components. Use Tailwind classes instead.',
    severity: 'hard',
    mode: 'ui'
  },
  {
    id: 'no-arbitrary-tailwind',
    label: 'No Arbitrary Tailwind',
    description: 'Avoids arbitrary values (e.g., w-[35px]). Enforces design system consistency.',
    severity: 'soft',
    mode: 'ui'
  },
  {
    id: 'require-alt-text',
    label: 'Accessibility: Alt Text',
    description: 'All <img> tags must have a meaningful alt attribute.',
    severity: 'hard',
    mode: 'ui'
  },
  
  // DevOps Constraints
  {
    id: 'no-latest-tag',
    label: 'No :latest Tags',
    description: 'Docker images must be pinned to specific versions, not :latest.',
    severity: 'hard',
    mode: 'devops'
  },
  {
    id: 'require-healthchecks',
    label: 'Require Healthchecks',
    description: 'All services must have a defined healthcheck block.',
    severity: 'hard',
    mode: 'devops'
  },
  {
    id: 'require-networks',
    label: 'Explicit Networks',
    description: 'Services must explicitly define networks, avoiding default bridge network.',
    severity: 'soft',
    mode: 'devops'
  }
];

export const validateConstraints = (code: string, activeConstraintIds: string[], mode: AppMode): Violation[] => {
  const violations: Violation[] = [];
  const activeConstraints = AVAILABLE_CONSTRAINTS.filter(c => activeConstraintIds.includes(c.id) && c.mode === mode);

  activeConstraints.forEach(constraint => {
    let isViolated = false;
    let evidence = '';

    // --- UI Validation Logic ---
    if (mode === 'ui') {
      if (constraint.id === 'no-inline-styles') {
        const match = code.match(/style\s*=\s*\{\{/);
        if (match) {
          isViolated = true;
          evidence = `Found inline style at: "${match[0]}..."`;
        }
      }
      if (constraint.id === 'no-arbitrary-tailwind') {
        // Look for -[123px] or -[#123456] pattern
        const match = code.match(/\w-\[[^\]]+\]/);
        if (match) {
          isViolated = true;
          evidence = `Found arbitrary value class: "${match[0]}"`;
        }
      }
      if (constraint.id === 'require-alt-text') {
        // Regex to find img tags without alt or with empty alt
        // Simple heuristic: match <img without "alt=" or with alt=""
        const imgTags = code.match(/<img[^>]+>/g) || [];
        for (const tag of imgTags) {
            if (!tag.includes('alt=') || tag.includes('alt=""') || tag.includes("alt=''")) {
                isViolated = true;
                evidence = `Found accessible violation in tag: ${tag}`;
                break;
            }
        }
      }
    }

    // --- DevOps Validation Logic ---
    if (mode === 'devops') {
        if (constraint.id === 'no-latest-tag') {
            const match = code.match(/image:.*:latest/);
            if (match) {
                isViolated = true;
                evidence = `Found volatile tag: "${match[0]}"`;
            }
            // Also check for images with NO tag (implicit latest), e.g. "image: nginx" vs "image: nginx:1.0"
            // This is trickier with regex, assuming standard "image: name:tag" format
            const imageLines = code.match(/image:\s*[\w\-/]+(\s|$)/gm);
            if (imageLines) {
                isViolated = true;
                evidence = `Found implicit latest tag: "${imageLines[0].trim()}"`;
            }
        }
        if (constraint.id === 'require-healthchecks') {
             // Heuristic: Check if 'healthcheck:' appears less times than 'image:' (rough approximation of services)
             // Better: check specific service blocks. 
             // Simple regex check: does the file contain "healthcheck:"?
             // A proper parser would be better, but regex is requested for deterministic simplicity in browser.
             // Let's just check if it's missing entirely if selected.
             if (!code.includes('healthcheck:')) {
                 isViolated = true;
                 evidence = "No 'healthcheck' definitions found in the entire file.";
             }
        }
        if (constraint.id === 'require-networks') {
            if (!code.includes('networks:')) {
                isViolated = true;
                evidence = "No 'networks' configuration block found.";
            }
        }
    }

    if (isViolated) {
      violations.push({
        constraintId: constraint.id,
        label: constraint.label,
        description: constraint.description,
        severity: constraint.severity,
        evidence
      });
    }
  });

  return violations;
};
