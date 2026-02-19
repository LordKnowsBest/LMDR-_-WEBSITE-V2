# Publishing Guide for LMDR SDKs

## JavaScript (`@lmdr/api-client`)
1. Update version in `sdk/js/lmdr-api-client/package.json`.
2. Run package smoke test:
   - `cd sdk/js/lmdr-api-client`
   - `npm test`
3. Publish:
   - `npm publish --access public`

## Python (`lmdr-python`)
1. Update version in `sdk/python/lmdr_python/pyproject.toml`.
2. Build package:
   - `cd sdk/python/lmdr_python`
   - `python -m build`
3. Publish:
   - `python -m twine upload dist/*`

## Release checklist
- [ ] Changelog updated
- [ ] SDK docs/examples updated
- [ ] Integration smoke test run with sandbox key
- [ ] Publish command output archived in release notes
