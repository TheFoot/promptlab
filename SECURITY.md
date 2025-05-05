# Security Policy

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability
We take the security of our project seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us responsibly.

Please report security vulnerabilities to:
- Email: security@thefootonline.com
- Create a private GitHub issue (if GitHub's private reporting is available)

### What to Include
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Potential impact of the vulnerability

We will acknowledge receipt of your vulnerability report at security@thefootonline.com within 48 hours and provide a more detailed response within 5 business days.

## Security Best Practices
When using PromptLab, please follow these security best practices:

1. **API Keys**: Never share your API keys publicly. PromptLab stores these in environment variables as per best practices.

2. **Sensitive Information**: Avoid storing sensitive information in your prompts, as they are stored in the database.

3. **User Input**: If using PromptLab in a multi-user environment, be cautious of potential injection attacks via user input.

4. **Regular Updates**: Keep your PromptLab installation updated with the latest security patches.

## Dependency Security
We regularly audit and update our dependencies to patch security vulnerabilities. You can help by:

- Running `npm audit` and reporting any high or critical vulnerabilities
- Submitting PRs that update outdated dependencies

Thank you for helping keep PromptLab secure!