# Speckit Constitution Command Template

**Command**: `/speckit.constitution`  
**Purpose**: Validate project compliance with Knowledge Network Constitution principles
**Input**: Current project state analysis
**Output**: Constitution compliance report with actionable recommendations

## Command Execution Workflow

### Phase 1: Constitution Assessment

1. **Load Constitution**: Read current constitution from `.specify/memory/constitution.md`
2. **Analyze Project Structure**: Examine monorepo organization and file structure
3. **Review Build System**: Check TypeScript configuration, build tools, and package management
4. **Assess Testing Implementation**: Verify Vitest setup and test coverage
5. **Evaluate Code Quality**: Check for clean code standards compliance
6. **Performance Review**: Validate performance requirements and optimization

### Phase 2: Compliance Check

Execute comprehensive review against each constitutional principle:

#### I. Test-First Development Compliance
- [ ] **TDD Process**: Verify tests exist before implementation
- [ ] **Test Framework**: Confirm Vitest with jsdom setup
- [ ] **Test Coverage**: Check coverage for initialization, edge bundling, rendering, interactions, error handling
- [ ] **Red-Green-Refactor**: Validate TDD cycle evidence

#### II. Clean Code Standards Compliance
- [ ] **TypeScript Config**: Verify strict configuration with ES2022 target
- [ ] **Naming Conventions**: Check PascalCase classes, camelCase functions, kebab-case configs
- [ ] **File Management**: Ensure no trash files (working-demo, test-basic, etc.)
- [ ] **Code Structure**: Validate clean file structure with production-only files

#### III. Modern TypeScript Practices Compliance
- [ ] **Strict Configuration**: Verify TypeScript strict mode
- [ ] **Type Definitions**: Check comprehensive types in `src/types.ts`
- [ ] **ES Modules**: Confirm modern ES module usage
- [ ] **D3.js Integration**: Validate proper TypeScript integration with D3.js v7

#### IV. Build System Integrity Compliance
- [ ] **Build Tools**: Confirm tsup for compilation, Vite for development
- [ ] **Import Validation**: Check for build corruption (d3 not d34)
- [ ] **Dual Output**: Verify ESM/CJS output support
- [ ] **Library Imports**: Test actual library functionality

#### V. Documentation Completeness Compliance
- [ ] **Docs Directory**: Verify comprehensive documentation in `docs/`
- [ ] **Research Documentation**: Check edge bundling research docs
- [ ] **Architecture Documentation**: Validate architectural guides
- [ ] **API Documentation**: Confirm all APIs and interfaces documented

#### VI. Performance & Scalability Compliance
- [ ] **Dataset Capacity**: Verify handling of 1000+ nodes
- [ ] **Rendering Performance**: Check Canvas/SVG rendering support
- [ ] **Edge Bundling Efficiency**: Validate algorithm performance
- [ ] **Progressive Loading**: Confirm status message implementation
- [ ] **60fps Target**: Verify smooth zoom/pan navigation

#### VII. Monorepo Organization Compliance
- [ ] **Project Structure**: Validate monorepo organization
- [ ] **Core Library**: Check `packages/knowledge-network/` structure
- [ ] **Demo Suite**: Verify `packages/demo-suite/` organization
- [ ] **Workspace Dependencies**: Confirm `workspace:*` usage
- [ ] **Modular Architecture**: Validate architectural principles

### Phase 3: Quality Gate Validation

#### Single Working Demo Policy
- [ ] **One Demo Only**: Verify single main demo at localhost:3000/3002
- [ ] **Integrated Experience**: Check all capabilities in single interface
- [ ] **No Fragmentation**: Ensure no separate test pages exist
- [ ] **Clean Naming**: Verify no "working-demo" or "test-basic" files

#### Build System Requirements
- [ ] **Tool Chain**: Confirm tsup + Vite + pnpm configuration
- [ ] **Testing Setup**: Validate Vitest + jsdom integration
- [ ] **Modern Standards**: Check ES2022 + D3.js v7 usage
- [ ] **Output Support**: Verify dual ESM/CJS compilation

### Phase 4: Governance Validation

- [ ] **Constitution Supremacy**: Verify constitution takes precedence
- [ ] **Amendment Process**: Check amendment documentation requirements
- [ ] **PR Compliance**: Validate review processes include constitution check
- [ ] **Complexity Justification**: Ensure complexity is justified against simpler alternatives

## Output Format

### Constitution Compliance Report

```markdown
# Constitution Compliance Report
**Project**: Knowledge Network
**Assessment Date**: [DATE]
**Constitution Version**: 1.0.0

## Executive Summary
[Overall compliance status: COMPLIANT / NEEDS ATTENTION / NON-COMPLIANT]

## Principle Compliance Status

### ✅ COMPLIANT Principles
- [List compliant principles with brief validation]

### ⚠️ NEEDS ATTENTION Principles
- [List principles with minor issues and recommendations]

### ❌ NON-COMPLIANT Principles
- [List non-compliant principles with required actions]

## Detailed Findings

### I. Test-First Development
**Status**: [COMPLIANT/NEEDS ATTENTION/NON-COMPLIANT]
**Findings**: [Specific observations]
**Actions Required**: [If any]

[Continue for each principle...]

## Quality Gate Status
- Single Working Demo Policy: [PASS/FAIL]
- Build System Requirements: [PASS/FAIL]
- Governance Requirements: [PASS/FAIL]

## Recommended Actions

### High Priority (Must Fix)
1. [Critical issues that violate constitution]

### Medium Priority (Should Fix)
1. [Issues that need attention but don't block development]

### Low Priority (Could Improve)
1. [Optimization opportunities]

## Compliance Certification

**Overall Assessment**: [CERTIFIED/CONDITIONAL/REJECTED]
**Certification Valid Until**: [DATE + 90 days or next major change]
**Next Review Required**: [When constitution changes or major project changes]
```

## Implementation Notes

### Technical Context Detection
Automatically detect and validate:
- **Language/Version**: TypeScript with ES2022 target
- **Primary Dependencies**: D3.js v7, tsup, Vite, Vitest
- **Storage**: File-based with potential Canvas/SVG optimization
- **Testing**: Vitest with jsdom for DOM testing
- **Target Platform**: Modern browsers with Canvas/SVG support
- **Project Type**: Monorepo with library + demo suite
- **Performance Goals**: 1000 nodes, 60fps, progressive loading
- **Scale/Scope**: Knowledge graph visualization library

### Constitution Integration
- Reference constitution version 1.0.0 from `.specify/memory/constitution.md`
- Cross-reference with AGENTS.md for runtime development guidance
- Ensure all findings align with established development standards
- Validate against Knowledge Network specific requirements

### Automation Opportunities
- Integrate with build system to run automatic constitution checks
- Generate compliance badges for documentation
- Create pre-commit hooks for constitution validation
- Set up continuous compliance monitoring

## Related Templates
- Use with `plan-template.md` for constitutional compliance during planning
- Reference `spec-template.md` for feature specification validation
- Integrate with `tasks-template.md` for implementation compliance
- Connect to `checklist-template.md` for manual verification workflows