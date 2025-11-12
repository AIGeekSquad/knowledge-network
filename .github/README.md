# CI/CD Pipeline Documentation

This directory contains the CI/CD workflows and configurations for the Knowledge Network project.

## 📋 Table of Contents

- [Workflows Overview](#workflows-overview)
- [Setup Instructions](#setup-instructions)
- [Required Secrets](#required-secrets)
- [Workflow Details](#workflow-details)
- [Troubleshooting](#troubleshooting)

## 🔄 Workflows Overview

### Core CI Workflows

#### 1. **CI** (`ci.yml`)
Runs on every push and pull request to main/develop branches.

**Jobs:**
- ✅ **Lint & Format Check**: Ensures code style consistency
- 🏗️ **Build**: Multi-node testing (18, 20, 22)
- 🧪 **Test**: Runs full test suite with coverage
- 📦 **Bundle Size Check**: Monitors bundle sizes
- 🔒 **Security Scan**: Audits dependencies

**Status:** Required for PR merge

#### 2. **SonarQube Analysis** (`sonarqube.yml`)
Continuous code quality analysis.

**Features:**
- Code quality metrics
- Code smells detection
- Security vulnerability scanning
- Test coverage tracking
- Quality gate enforcement

#### 3. **Cross-Browser Testing** (`playwright.yml`)
Tests across Chromium, Firefox, and WebKit.

**Schedule:** Daily at 2 AM UTC + on PRs

### Deployment Workflows

#### 4. **Release & Publish** (`release.yml`)
Automated release process triggered by version tags.

**Process:**
1. Build and test verification
2. Publish to NPM registry
3. Create GitHub release with auto-generated notes
4. Notify team via Slack (optional)

**Trigger:** Push tags matching `v*.*.*` (e.g., v1.0.0)

#### 5. **Deploy to GitHub Pages** (`deploy.yml`)
Deploys demo site to GitHub Pages.

**Trigger:** Push to main branch
**URL:** https://aigeeksquad.github.io/knowledge-network/

#### 6. **PR Preview** (`pr-preview.yml`)
Creates preview deployments for pull requests.

**Features:**
- Unique URL per PR
- Auto-updates on new commits
- Auto-cleanup on PR close

### Quality & Maintenance Workflows

#### 7. **Performance Testing** (`performance.yml`)
Monitors performance metrics and bundle sizes.

**Includes:**
- Bundle size limits enforcement
- Lighthouse audit
- Build time tracking

#### 8. **Semantic Versioning** (`semantic-version.yml`)
Manual workflow for version bumps.

**Usage:**
```bash
# Via GitHub UI: Actions > Semantic Versioning > Run workflow
# Select: patch | minor | major | prerelease
```

#### 9. **Dependency Check** (`dependency-check.yml`)
Weekly security and license audits.

**Schedule:** Every Monday at 9 AM UTC

## 🔧 Setup Instructions

### 1. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Save

### 2. Configure Branch Protection

Add branch protection rules for `main`:

```yaml
Required checks:
  - Lint & Format Check
  - Build (Node 18, 20, 22)
  - Test (Node 18, 20, 22)
  - Bundle Size Check
  - Security Scan

Settings:
  - Require branches to be up to date
  - Require status checks to pass
  - Restrict who can push
```

### 3. Configure Dependabot

Dependabot is configured via `.github/dependabot.yml`.
It will automatically create PRs for dependency updates weekly.

## 🔐 Required Secrets

### For NPM Publishing
```
NPM_TOKEN - Token for publishing to npm registry
```

**How to create:**
1. Login to npmjs.com
2. Access Tokens → Generate New Token
3. Select: Automation
4. Add to GitHub Secrets

### For SonarQube (Optional)
```
SONAR_TOKEN - SonarQube authentication token
SONAR_HOST_URL - SonarQube server URL (default: https://sonarcloud.io)
```

**How to create:**
1. Create account on sonarcloud.io
2. Create new project
3. Generate token
4. Add both secrets to GitHub

### For Netlify Preview (Optional)
```
NETLIFY_AUTH_TOKEN - Netlify personal access token
NETLIFY_SITE_ID - Your Netlify site ID
```

**How to create:**
1. Login to netlify.com
2. User Settings → Applications → New access token
3. Create new site for previews
4. Add both secrets to GitHub

### For Slack Notifications (Optional)
```
SLACK_WEBHOOK_URL - Incoming webhook URL
```

**How to create:**
1. Create Slack app
2. Enable Incoming Webhooks
3. Add to workspace
4. Copy webhook URL
5. Add to GitHub Secrets

## 📊 Workflow Details

### CI Workflow Diagram

```
┌─────────────────┐
│  Push/PR Event  │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Lint   │
    └────┬────┘
         │
    ┌────┴────┐
    │  Build  │  (Node 18, 20, 22)
    └────┬────┘
         │
    ┌────┴────┐
    │  Test   │  (Node 18, 20, 22)
    └────┬────┘
         │
    ┌────┴──────────┬──────────┐
    │               │          │
┌───┴────┐   ┌─────┴──────┐  ┌┴──────┐
│ Bundle │   │  Security  │  │Status │
│  Size  │   │   Scan     │  │ Check │
└────────┘   └────────────┘  └───────┘
```

### Release Workflow Diagram

```
┌──────────────┐
│ Push v*.*.* │
│     Tag     │
└──────┬───────┘
       │
  ┌────┴─────┐
  │Build/Test│
  └────┬─────┘
       │
  ┌────┴────┬─────────┐
  │         │         │
┌─┴──┐  ┌──┴──┐  ┌───┴───┐
│NPM │  │GitHub│ │ Slack │
│Pub │  │Release│ │Notify │
└────┘  └──────┘ └───────┘
```

## 🐛 Troubleshooting

### Build Fails on CI but Works Locally

**Issue:** Different Node versions
**Solution:** 
```bash
# Check your local Node version
node --version

# Use nvm to test with CI versions
nvm install 18 && nvm use 18 && pnpm test
nvm install 20 && nvm use 20 && pnpm test
nvm install 22 && nvm use 22 && pnpm test
```

### Tests Timeout on CI

**Issue:** CI resources are limited
**Solution:** Increase timeout in test configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  }
});
```

### Bundle Size Check Fails

**Issue:** Bundle exceeded size limit
**Solution:** 
1. Review recent changes
2. Check for unnecessary dependencies
3. Use dynamic imports for large modules
4. Update size limits in `performance.yml` if justified

### NPM Publish Fails

**Checklist:**
- [ ] NPM_TOKEN secret is set
- [ ] Token has publish permissions
- [ ] Package name is not taken
- [ ] Version number is unique
- [ ] package.json is valid

### SonarQube Not Working

**Checklist:**
- [ ] SONAR_TOKEN secret is set
- [ ] SONAR_HOST_URL is correct
- [ ] Project key matches sonar-project.properties
- [ ] Coverage files are generated

## 📈 Metrics & Reporting

### Coverage Reports
- Uploaded to Codecov automatically
- Available in PR comments
- Threshold: 80% minimum (configurable)

### Bundle Size
- Tracked in CI summary
- ESM limit: 300KB
- CJS limit: 300KB

### Performance
- Lighthouse scores tracked
- Performance budget enforced
- Results in PR comments

## 🔄 Update Workflow

To update workflows:

1. Edit workflow files in `.github/workflows/`
2. Test locally with [act](https://github.com/nektos/act) if possible
3. Create PR with changes
4. Workflows will run on the PR
5. Merge after verification

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Playwright Documentation](https://playwright.dev)
- [SonarQube Documentation](https://docs.sonarqube.org)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation
2. Review workflow run logs on GitHub
3. Check [GitHub Actions status](https://www.githubstatus.com/)
4. Open an issue with `ci/cd` label
