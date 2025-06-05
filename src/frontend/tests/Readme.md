# Frontend Testing Guide

## E2E Tests with Playwright

### Dependencies Issue Workaround

If you're encountering system time issues with `npx playwright install-deps` (release files not valid yet), you can try the following:

1. Fix your system time:
   ```bash
   sudo hwclock --hctosys
   # Or manually set time
   sudo date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
   ```

2. Run tests with existing browsers:
   ```bash
   # Run with system browser only
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npx playwright test --project=chromium
   ```

3. Run in debug mode to see the browser:
   ```bash
   npx playwright test --debug
   ```

4. Run tests and generate screenshots (helpful when debugging):
   ```bash
   npx playwright test
   ```

### Common Issues

- **No tests found**: Ensure your test files end with `.spec.ts` or `.test.ts`
- **Cannot find module**: Run `npm install` to install dependencies
- **Element not found**: Test might be looking for elements that don't exist in your UI

### Troubleshooting Screenshots

The test will generate screenshots at key points:
- After form loads
- After filling the form
- After form submission

Check these images in your project root to see what's happening.

### Original Setup Commands (for reference)
```bash
npx playwright install
npx playwright install-deps
```

### Additional Dependencies (if needed)

If you encounter issues related to missing dependencies, you can install the following (for Ubuntu/Debian systems):

```bash
sudo apt-get install libgstreamer-plugins-bad1.0-0    libflite1                               libavif16
```