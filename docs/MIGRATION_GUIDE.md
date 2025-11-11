# Migration Guide

**Version upgrade guidance and breaking change migration**

---

## Overview

The knowledge-network library follows semantic versioning and maintains backward compatibility within major versions. This guide helps you migrate between major versions and understand breaking changes.

**Current Version**: Check your installed version with `npm list @aigeeksquad/knowledge-network`

---

## Migration Philosophy

### Semantic Versioning

- **Major versions** (1.0.0 → 2.0.0): Breaking changes requiring code updates
- **Minor versions** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch versions** (1.0.0 → 1.0.1): Bug fixes, fully compatible

### Deprecation Process

Before removing features, the library follows a deprecation cycle:

1. **Deprecation Warning**: Feature marked deprecated, warning logged
2. **Alternative Provided**: New approach available alongside deprecated one
3. **Documentation Updated**: New pattern documented, old pattern noted as deprecated
4. **Next Major Version**: Deprecated feature removed

---

## How to Migrate

### Before Upgrading

1. **Review changelog**: Check `CHANGELOG.md` for breaking changes
2. **Update tests**: Ensure your test suite covers current usage
3. **Check deprecation warnings**: Review console for any deprecated feature usage
4. **Backup working version**: Commit current state before upgrading

### Migration Process

```bash
# 1. Check current version
npm list @aigeeksquad/knowledge-network

# 2. Review breaking changes in target version
# Visit: https://github.com/aigeeksquad/knowledge-network/releases

# 3. Update package
npm install @aigeeksquad/knowledge-network@latest

# 4. Run tests to identify issues
npm test

# 5. Fix breaking changes using this guide
# 6. Test thoroughly before deploying
```

---

## Breaking Change Patterns

### Configuration Changes

When configuration properties are renamed or restructured:

```typescript
// Example: hypothetical change in v2.0
// Old approach (v1.x)
const oldConfig = {
  nodeSize: 10,              // Renamed
  edgeColor: '#999',         // Renamed
  bundling: {                // Moved
    enabled: true,
    strength: 0.5
  }
};

// New approach (v2.0+)
const newConfig = {
  nodeRadius: 10,            // Renamed from nodeSize
  linkStroke: '#999',        // Renamed from edgeColor
  edgeRenderer: 'bundled',   // Replaces bundling.enabled
  edgeBundling: {            // Simplified
    compatibilityThreshold: 0.5  // Renamed from strength
  }
};
```

### API Method Changes

When method signatures change:

```typescript
// Example: hypothetical change in v2.0
// Old approach (v1.x)
graph.render(callback);              // Callback parameter
graph.updateNodes(nodes, options);   // Separate node/edge updates

// New approach (v2.0+)
await graph.render();                // Returns Promise
graph.updateData({ nodes, edges });  // Unified data update
```

### Import Changes

When module structure changes:

```typescript
// Example: hypothetical change in v2.0
// Old imports (v1.x)
import KnowledgeGraph from '@aigeeksquad/knowledge-network';           // Default export
import { EdgeBundler } from '@aigeeksquad/knowledge-network/bundling'; // Deep imports

// New imports (v2.0+)
import { KnowledgeGraph, EdgeBundling } from '@aigeeksquad/knowledge-network'; // Named exports
```

---

## Migration Utilities

### Configuration Migrator

```typescript
/**
 * Utility to migrate old configuration format to new format
 * Use when configuration structure changes between versions
 */
export function migrateConfig(oldConfig: any, fromVersion: string): GraphConfig {
  const migrations = {
    '1.0': (config: any): GraphConfig => {
      // Example migration from v1.0 to v2.0
      return {
        ...config,
        nodeRadius: config.nodeSize,           // Rename
        linkStroke: config.edgeColor,          // Rename
        edgeRenderer: config.bundling?.enabled ? 'bundled' : 'simple',
        edgeBundling: config.bundling ? {
          compatibilityThreshold: config.bundling.strength
        } : undefined
      };
    }

    // Add more migrations as versions release
  };

  const migrator = migrations[fromVersion];
  if (!migrator) {
    console.warn(`No migration available from version ${fromVersion}`);
    return oldConfig;
  }

  const migratedConfig = migrator(oldConfig);
  console.log('Configuration migrated from version', fromVersion);
  return migratedConfig;
}

// Usage
const oldConfig = loadOldConfiguration();
const newConfig = migrateConfig(oldConfig, '1.0');
const graph = new KnowledgeGraph(container, data, newConfig);
```

### Data Structure Migrator

```typescript
/**
 * Migrate data structure changes between versions
 */
export function migrateData(data: any, fromVersion: string): GraphData {
  const migrations = {
    '1.0': (data: any): GraphData => {
      // Example: node property changes
      return {
        nodes: data.nodes.map(node => ({
          ...node,
          metadata: node.meta || {}  // Rename meta → metadata
        })),
        edges: data.edges.map(edge => ({
          ...edge,
          weight: edge.strength      // Rename strength → weight
        }))
      };
    }
  };

  const migrator = migrations[fromVersion];
  return migrator ? migrator(data) : data;
}
```

### Deprecation Warning Helper

```typescript
/**
 * Helper to warn about deprecated features during development
 */
export function warnDeprecated(
  featureName: string,
  alternative: string,
  removalVersion: string
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED] ${featureName} is deprecated and will be removed in version ${removalVersion}. ` +
      `Use ${alternative} instead.`
    );
  }
}

// Usage in library code
export class KnowledgeGraph {
  someOldMethod() {
    warnDeprecated(
      'someOldMethod()',
      'newMethod()',
      'v3.0.0'
    );

    // Continue with implementation for backward compatibility
  }
}
```

---

## Rollback Strategy

### Safe Rollback Process

If migration causes issues:

```bash
# 1. Revert to previous version
npm install @aigeeksquad/knowledge-network@1.2.3  # Known working version

# 2. Verify functionality restored
npm test

# 3. Review migration guide again
# 4. Attempt migration in smaller steps
# 5. Test each change individually
```

### Version Pinning

```json
// package.json - pin to specific version during migration
{
  "dependencies": {
    "@aigeeksquad/knowledge-network": "1.2.3"  // Exact version
  }
}

// package.json - or use tilde for patch updates only
{
  "dependencies": {
    "@aigeeksquad/knowledge-network": "~1.2.3"  // 1.2.x patches only
  }
}
```

---

## Version History Template

### Major Version Template

```markdown
## Migrating from v1.x to v2.0

### Breaking Changes

#### 1. Configuration Structure
**What changed**: Node styling properties renamed for consistency with d3.js patterns
**Migration**: Update property names in your configuration

Old (v1.x):
```typescript
{
  nodeSize: 10,
  nodeColor: '#ff0000'
}
```

New (v2.0+):
```typescript
{
  nodeRadius: 10,     // renamed from nodeSize
  nodeFill: '#ff0000' // renamed from nodeColor
}
```

#### 2. Method Signatures
**What changed**: render() method now returns Promise for better async handling
**Migration**: Add await or .then() when calling render()

Old (v1.x):
```typescript
graph.render();
doSomethingAfterRender();
```

New (v2.0+):
```typescript
await graph.render();
doSomethingAfterRender();

// Or with promises
graph.render().then(() => {
  doSomethingAfterRender();
});
```

#### 3. Import Changes
**What changed**: Switch from default export to named exports for better tree shaking
**Migration**: Update import statements

Old (v1.x):
```typescript
import KnowledgeGraph from '@aigeeksquad/knowledge-network';
```

New (v2.0+):
```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
```

### Automated Migration

Use the configuration migrator utility:
```typescript
import { migrateConfig } from '@aigeeksquad/knowledge-network/migrate';

const oldConfig = { /* your v1.x config */ };
const newConfig = migrateConfig(oldConfig, '1.0');
```

### Testing Your Migration

1. **Update imports and basic configuration**
2. **Run existing tests** - should pass with minimal changes
3. **Check console warnings** - address any deprecation notices
4. **Test visual output** - ensure graphs render correctly
5. **Performance test** - verify performance characteristics maintained
```

---

## Future Migration Planning

### Preparing for Future Versions

**Best Practices:**
- Use current API patterns consistently
- Avoid deprecated features
- Keep configuration objects well-structured
- Monitor console warnings during development
- Follow recommended patterns from documentation

**Configuration Future-Proofing:**
```typescript
// ✅ Future-friendly patterns
const config: GraphConfig = {
  // Use current property names
  nodeRadius: 10,           // Not deprecated aliases
  nodeFill: '#4ecdc4',      // Canonical property names

  // Structured configuration
  edgeBundling: {           // Nested objects as documented
    iterations: 120,
    compatibilityThreshold: 0.4
  }
};

// ❌ Avoid deprecated or undocumented patterns
const fragileConfig = {
  size: 10,                 // Undocumented alias
  bundlingStrength: 0.4     // Non-standard property name
};
```

---

## Need Migration Help?

### Resources

- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common migration issues
- **[Complete API Reference](../packages/knowledge-network/README.md)** - Current API patterns
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Framework-specific migration patterns

### Community Support

- **[GitHub Issues](https://github.com/aigeeksquad/knowledge-network/issues)** - Report migration problems
- **[GitHub Discussions](https://github.com/aigeeksquad/knowledge-network/discussions)** - Migration questions and community help

### Professional Support

For large-scale migrations or custom migration assistance, consider:
- Detailed migration analysis
- Custom migration scripts
- Performance optimization consultation

---

**Note**: This guide is updated with each major version release. Historical migration information is preserved in git history and release notes.