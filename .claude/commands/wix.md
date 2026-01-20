# Wix CLI Commands

This skill provides instructions for using the Wix CLI in this project. Use these commands for local development, package management, and deployment of the Wix site.

---

## Authentication

Authentication commands require user interaction. Claude should NOT attempt to complete authentication flows.

### Login
```bash
wix login
```
Opens browser for authentication. **The user must complete this step themselves.**

### Logout
```bash
wix logout
```
Signs out of the current Wix account.

### Check Current User
```bash
wix whoami
```
Displays the currently authenticated Wix account.

**Example:**
```bash
wix whoami
# Output: Logged in as: user@example.com
```

---

## Development

### Start Local Development Server
```bash
wix dev
```
Starts the local development server for testing changes.

**Flags:**
- `--tunnel` - Required when using cloud-based IDEs (creates a secure tunnel)

**Examples:**
```bash
# Standard local development
wix dev

# Cloud IDE development (e.g., GitHub Codespaces, Gitpod)
wix dev --tunnel
```

**Notes:**
- The dev server provides hot reloading for Velo code changes
- Local server typically runs on `http://localhost:5000`
- Press `Ctrl+C` to stop the server

---

## Package Management

### Install Packages
```bash
wix install [package-name]
```
Installs npm packages for use in Velo backend code.

**Flags:**
- `--npm` - Use npm as the package manager
- `--yarn` - Use yarn as the package manager

**Examples:**
```bash
# Install a specific package
wix install lodash

# Install with npm explicitly
wix install axios --npm

# Install with yarn
wix install moment --yarn

# Install without specifying a package (installs all dependencies)
wix install
```

### Update Packages
```bash
wix update [package-name]
```
Updates installed packages to their latest compatible versions.

**Examples:**
```bash
# Update a specific package
wix update lodash

# Update all packages
wix update
```

### Uninstall Packages
```bash
wix uninstall [package-name]
```
Removes a package from the project.

**Example:**
```bash
wix uninstall lodash
```

---

## Deployment

### Preview (Staging)
```bash
wix preview
```
Creates a shareable preview version of the site. This is useful for testing before production deployment.

**Notes:**
- Preview URLs are temporary and shareable
- Use this to get stakeholder approval before publishing
- Preview does not affect the live production site

**Example workflow:**
```bash
# Create a preview for testing
wix preview
# Output: Preview available at: https://user.wixsite.com/mysite?preview=true
```

### Publish (Production)

> **WARNING: DESTRUCTIVE COMMAND**
>
> This command deploys changes to the live production site. Always confirm with the user before executing.

```bash
wix publish
```
Deploys the current state to the live production site.

**SAFETY REQUIREMENTS:**
1. Always ask for explicit user confirmation before running `wix publish`
2. Recommend running `wix preview` first to verify changes
3. Ensure the user understands this affects the live site

**Example confirmation prompt:**
```
I am about to run `wix publish` which will deploy changes to your live production site.
This action will immediately affect your live website visitors.

Are you sure you want to proceed? (yes/no)
```

---

## Help

### Display Help
```bash
wix -h
```
Shows all available Wix CLI commands and options.

**Example:**
```bash
wix -h
# Displays full command reference
```

---

## Common Workflows

### Development to Production Workflow

The recommended workflow for making changes:

```
1. Development   -->   2. Preview   -->   3. Publish
   wix dev              wix preview        wix publish
```

**Step-by-step:**

```bash
# Step 1: Start local development
wix dev

# Make your code changes, test locally

# Step 2: Create a preview for stakeholder review
wix preview

# Share preview URL, get approval

# Step 3: Deploy to production (with confirmation)
wix publish
```

### Setting Up a New Development Session

```bash
# Check authentication status
wix whoami

# If not logged in, prompt user to authenticate
wix login

# Start development server
wix dev
```

### Adding a New Dependency

```bash
# Install the package
wix install axios

# Start dev server to test
wix dev

# When ready, preview then publish
wix preview
wix publish
```

---

## Error Handling

### Common Issues

| Error | Solution |
|-------|----------|
| "Not logged in" | Run `wix login` (user must complete) |
| "Site not found" | Verify you are in the correct project directory |
| "Permission denied" | Check that the logged-in user has access to the site |
| "Dev server port in use" | Stop other processes using port 5000 |

### Debugging Tips

1. Always check authentication status with `wix whoami` first
2. Use `wix -h` to verify command syntax
3. Check the terminal output for specific error messages
4. Ensure you are in the project root directory

---

## Command Quick Reference

| Command | Description | Requires Confirmation |
|---------|-------------|----------------------|
| `wix dev` | Start local dev server | No |
| `wix dev --tunnel` | Dev server with tunnel | No |
| `wix install [pkg]` | Install package | No |
| `wix update [pkg]` | Update package | No |
| `wix uninstall [pkg]` | Remove package | No |
| `wix preview` | Create preview | No |
| `wix publish` | Deploy to production | **YES** |
| `wix login` | Authenticate | User completes |
| `wix logout` | Sign out | No |
| `wix whoami` | Check user | No |
| `wix -h` | Show help | No |

---

## Safety Notes

1. **Never run `wix publish` without explicit user confirmation**
2. **Never attempt to complete `wix login` authentication flows** - always instruct the user to complete this step themselves
3. **Always recommend `wix preview` before `wix publish`** to allow testing
4. **Check `wix whoami`** at the start of deployment workflows to ensure proper authentication
