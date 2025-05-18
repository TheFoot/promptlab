# GitHub Actions Workflows Documentation

This document describes the GitHub Actions workflows used in the PromptLab project and how they can be extended or modified.

## Overview

The project uses three main workflows:

1. **Continuous Integration (CI)** - Runs on all pushes except to the main branch
2. **Pull Request (PR) Checks** - Runs when PRs are created or updated targeting the main branch
3. **Release Workflow** - Manually triggered to create releases, tag versions, and publish Docker images

All workflows use a common reusable workflow for standard CI steps to maintain consistency and avoid duplication.

## Workflow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      ci.yml     │     │     pr.yml      │     │   release.yml   │
│  (Push Trigger) │     │  (PR Trigger)   │     │(Manual Trigger) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────┐ ┌─────────────────┐
│          ci-common.yml (Reusable)           │ │Version Increment│
│                                             │ └────────┬────────┘
│ ┌─────────┐ ┌────────┐ ┌─────┐ ┌─────────┐ │          │
│ │ Install │ │  Test  │ │Lint │ │  Build  │ │          │
│ │   Deps  │ │Frontend│ │Code │ │Frontend │ │          ▼
│ └─────────┘ │Backend │ └─────┘ └─────────┘ │ ┌─────────────────┐
│             └────────┘                     │ │Create GitHub Tag│
│ ┌─────────────────────┐ ┌───────────────┐ │ └────────┬────────┘
│ │Check Dependencies   │ │Docker Build   │ │          │
│ └─────────────────────┘ └───────────────┘ │          ▼
└─────────────────────────────────────────────┘ ┌─────────────────┐
                                                │GitHub Release   │
                                                └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │Docker Build/Push│
                                                └─────────────────┘
```

## Reusable Workflow: workflows/ci-common.yml

This workflow contains the common CI steps used by both the CI and PR workflows:

- **Install Dependencies**: Sets up Node.js and installs all dependencies
- **Dependency Check**: Identifies outdated dependencies
- **Frontend Tests**: Runs Vue component and unit tests
- **Backend Tests**: Runs Node.js backend tests
- **Lint Code**: Runs ESLint across the codebase
- **Build Frontend**: Builds the Vue frontend for production
- **Docker Build**: Validates the Dockerfile by building an image

The workflow accepts several input parameters that allow calling workflows to control which steps run.

## CI Workflow: ci.yml

Triggered on all pushes to non-main branches. It calls the reusable workflow with all steps enabled.

Key features:
- Ignores documentation changes and other non-code files
- Runs the complete test suite, linting, and build validation
- Ensures code quality for active development

## PR Workflow: pr.yml

Triggered when pull requests are created or updated that target the main branch.

Key features:
- Runs the same checks as the CI workflow
- Includes a placeholder for future quality gates (e.g., SonarCloud integration)
- Ensures merged code meets quality standards

## Release Workflow: release.yml

Manually triggered from the GitHub interface with a form to select the version bump type.

Key features:
- **Version Bumping**: Updates version in all package.json files
- **Release Notes Generation**: Creates categorized release notes from commit messages
- **GitHub Release**: Creates a proper GitHub release with the generated notes
- **Docker Publishing**: Builds and publishes the Docker image with version and latest tags

The workflow performs these steps in sequence, with each step dependent on the success of the previous one.

## Extending the Workflows

### Adding New CI Steps

To add new CI steps to the reusable workflow:

1. Edit `.github/workflows/ci-common.yml`
2. Add a new job or add steps to an existing job
3. Consider adding an input parameter to control when the step runs

Example for adding a security scanning step:

```yaml
# In ci-common.yml
on:
  workflow_call:
    inputs:
      # Add a new input
      run-security-scan:
        required: false
        type: boolean
        default: true

jobs:
  # Add a new job
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: install-dependencies
    if: ${{ inputs.run-security-scan }}
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          
      - name: Restore Dependencies Cache
        uses: actions/cache@v4
        with:
          path: |
            node_modules
            frontend/node_modules
            backend/node_modules
          key: ${{ runner.os }}-node-${{ inputs.node-version }}-${{ hashFiles('**/package-lock.json') }}
          
      - name: Run Security Scan
        run: npm audit --production
```

Then update the calling workflows to include the new parameter:

```yaml
# In ci.yml and pr.yml
jobs:
  ci:
    uses: ./.github/reusable-workflows/ci-common.yml
    with:
      run-security-scan: true
```

### Adding SonarCloud Integration

The PR workflow includes a placeholder for SonarCloud integration. To implement it:

1. Sign up for SonarCloud and connect your repository
2. Add the required secrets (see Secrets section below)
3. Update the `quality-gate` job in `.github/workflows/pr.yml`:

```yaml
quality-gate:
  name: SonarCloud Analysis
  runs-on: ubuntu-latest
  needs: ci
  steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Modifying the Release Process

To change how releases are created:

1. Edit `.github/workflows/release.yml`
2. Modify the `prepare-release` job to change version handling
3. Modify the `create-github-release` job to change release creation
4. Modify the `build-and-publish` job to change Docker publishing

## Required GitHub Secrets and Variables

The following secrets should be configured in your GitHub repository settings:

| Secret Name | Description | Required For |
|-------------|-------------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username | Release workflow |
| `DOCKERHUB_TOKEN` | Docker Hub API token (not your password) | Release workflow |
| `SONAR_TOKEN` | SonarCloud API token | PR workflow (optional) |

The workflows use the built-in `GITHUB_TOKEN` secret for repository operations, which is automatically provided by GitHub.

## Best Practices

1. **Test Locally**: Test workflow changes locally using [act](https://github.com/nektos/act) before pushing
2. **Use Reusable Workflows**: Extract common functionality into reusable workflows
3. **Parallel Jobs**: Design workflows with parallel jobs to reduce total execution time
4. **Caching**: Leverage workflow caching to speed up builds
5. **Secret Management**: Never hardcode secrets or tokens in workflow files

## Troubleshooting

### Common Issues

- **Workflow Didn't Run**: Verify the trigger conditions (branches, paths) in the workflow file
- **Docker Build Failed**: Check Dockerfile syntax and build context
- **Release Failed**: Ensure proper permissions for the GitHub token

### Debugging Workflows

1. View the workflow runs in the GitHub Actions tab
2. Check the detailed logs for each job and step
3. Add debug steps to workflows if needed:

```yaml
- name: Debug Information
  run: |
    echo "GitHub Ref: ${{ github.ref }}"
    echo "GitHub Event: ${{ github.event_name }}"
    ls -la
```

## Future Enhancements

Potential improvements to consider:

1. **Automated Dependency Updates**: Integrate Dependabot or Renovate
2. **Performance Testing**: Add performance benchmarking jobs
3. **Deployment Workflows**: Add workflows for automatic deployments
4. **Matrix Testing**: Expand testing to multiple Node.js versions
5. **E2E Testing**: Add end-to-end testing jobs