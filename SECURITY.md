# Security Policy

## Our Commitment

This repository contains research data, experimental protocols, infrastructure code, and platform source material. We take the security of our project and its community seriously. Whether you've found a vulnerability in the UNBOUNDED platform code, the Termite Research Initiative data pipelines, or our collaboration infrastructure, we want to hear from you.

## Scope

This security policy covers all code, documentation, configuration, and infrastructure within the **termite-biotech-and-unbounded** repository, including:

- `unbounded/` — the UNBOUNDED new media platform (code, site, documentation)
- `termite-projects/` — the Termite Research Initiative (research data, analysis scripts, protocols)
- `.github/` — community and contribution infrastructure
- Repository configuration files and CI/CD pipelines

Out of scope:
- Third-party dependencies — report those to their respective maintainers
- Forked or derivative repositories — those should establish their own policies

## Supported Versions

As this is an early-stage project, we currently support only the latest version of the code in the main branch. All security fixes will be applied to the main branch and, where practical, tagged with a patch release.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

Once the project reaches a stable release milestone, we will establish an LTS policy.

## Reporting a Vulnerability

### How to Report

**Do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following channels:

1. **Confidential GitHub issue**: Create an issue with the label `[SECURITY]` in the title. The repository maintainers will treat it as confidential.
2. **Email**: Send details to `security@termite-biotech-unbounded.project`
3. **Community steward**: If you are a member of our community, you can reach out directly to any current Steward (see GOVERNANCE.md) through a private channel.

### What to Include

To help us respond efficiently, please include:

- A clear description of the vulnerability
- Steps to reproduce it (conceptually, without weaponizing the report)
- The affected component, file, or endpoint
- Your assessment of potential impact (e.g., data exposure, code execution, privilege escalation)
- Any suggested fixes, if you have them
- Your contact information (optional — you may report anonymously)

### What to Expect

- **Acknowledgment**: You will receive an acknowledgment of your report within **48 hours**.
- **Triage**: We will assess the report and determine its severity within **5 business days**.
- **Fix timeline**: Depending on severity, we aim to:
  - **Critical**: Fix within 72 hours, release a patch within 7 days
  - **High**: Fix within 7 days, release a patch within 14 days
  - **Medium**: Fix within 30 days
  - **Low**: Fix within the next release cycle
- **Disclosure**: We will coordinate with you on public disclosure timing. We believe in responsible disclosure and will aim to publish details after a fix is available.

### After Reporting

We will keep you informed of progress. If we need additional information, we will reach out. You are welcome to check in if you haven't heard from us within the expected response times.

## Preferred Languages

We prefer all communication in English or Tagalog.

## Recognition

We believe in giving credit. With your permission, we will acknowledge your contribution to our security in our release notes and, where applicable, our security advisory. If you prefer to remain anonymous, we will respect that completely.

## Legal Safe Harbor

We consider security research conducted in good faith, and reported according to this policy, to be legitimate and protected activity. We will not pursue legal action against researchers who:

- Follow this disclosure policy
- Do not access or modify more data than necessary to demonstrate the vulnerability
- Do not exfiltrate, delete, or corrupt data
- Do not engage in social engineering, denial of service, or physical attacks

## Contact

For all security matters: **security@termite-biotech-unbounded.project**

---

*This security policy is a living document. Propose improvements via pull request or issue.*
