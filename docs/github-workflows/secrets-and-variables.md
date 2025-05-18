# GitHub Secrets and Variables

This document lists all the secrets and variables required for the GitHub Actions workflows in the PromptLab project.

## Required Secrets

| Secret Name | Description | How to Obtain | Used In |
|-------------|-------------|--------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | Your Docker Hub account name | `release.yml` workflow for publishing Docker images |
| `DOCKERHUB_TOKEN` | Access token for Docker Hub | 1. Go to [Docker Hub Account Settings](https://hub.docker.com/settings/security)<br>2. Click "New Access Token"<br>3. Give it a name and set appropriate permissions (Read, Write, Delete) | `release.yml` workflow for authenticating with Docker Hub |

## Optional Secrets (For Future Extensions)

| Secret Name | Description | How to Obtain | Used In |
|-------------|-------------|--------------|---------|
| `SONAR_TOKEN` | API token for SonarCloud integration | 1. Sign up for [SonarCloud](https://sonarcloud.io)<br>2. Set up your organization and project<br>3. Go to Account → Security → Generate Tokens | Placeholder in `pr.yml` for future SonarCloud integration |
| `NPM_TOKEN` | Access token for publishing to npm | 1. Go to [npm Access Tokens](https://www.npmjs.com/settings/tokens)<br>2. Click "Generate New Token"<br>3. Select "Automation" token type | Can be added to release workflow if publishing npm packages |

## Built-in Secrets

| Secret Name | Description | How It's Used |
|-------------|-------------|--------------|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions | Used for:<br>- Creating and pushing Git tags<br>- Creating GitHub releases<br>- Committing version changes<br>- Accessing repository during workflow runs |

## How to Add Secrets to Your Repository

1. Navigate to your GitHub repository
2. Go to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the name and value of the secret
5. Click "Add secret"

## Environment Variables

Currently, the workflows do not use any custom environment variables. All configuration is done through workflow inputs and secrets.

## Security Considerations

- **Never** commit secrets to your repository
- Use secrets for any sensitive information
- Limit the permissions of access tokens to only what's needed
- Rotate secrets periodically for enhanced security
- Consider using GitHub's OIDC integration for cloud provider authentication instead of static credentials

## Troubleshooting Secret Issues

If you encounter issues with secrets:

1. Verify the secret is correctly added in GitHub repository settings
2. Check that the secret name matches exactly what's referenced in the workflow files
3. For Docker Hub authentication failures, ensure your access token has appropriate permissions
4. Remember that secrets are not available in workflows triggered by pull requests from forks (for security reasons)