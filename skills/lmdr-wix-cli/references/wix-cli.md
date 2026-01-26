# Wix CLI Commands

This skill provides instructions for using the Wix CLI in this project.
Use these commands for local development, package management, and deployment.

## Authentication

Authentication commands require user interaction. Do not attempt to complete
authentication flows.

### Login
```bash
wix login
```
User completes in browser.

### Logout
```bash
wix logout
```

### Check Current User
```bash
wix whoami
```

## Development

### Start Local Development Server
```bash
wix dev
```

Flags:
- `--tunnel` for cloud IDEs

## Package Management

### Install Packages
```bash
wix install [package-name]
```

### Update Packages
```bash
wix update [package-name]
```

### Uninstall Packages
```bash
wix uninstall [package-name]
```

## Deployment

### Preview (Staging)
```bash
wix preview
```

### Publish (Production)

WARNING: This is destructive and requires explicit user confirmation.

```bash
wix publish
```

## Common Workflow

```
wix dev
wix preview
wix publish
```

## Safety Notes

1. Never run `wix publish` without explicit user confirmation.
2. Never attempt to complete `wix login` in the browser.
3. Recommend `wix preview` before `wix publish`.
4. Check `wix whoami` before deployment workflows.

