# Contributing to Grammar Fixer Pro

We love your input! We want to make contributing to Grammar Fixer Pro as easy and transparent as possible.

## Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

## Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the project's style guidelines
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](LICENSE) that covers the project.

## Report bugs using GitHub's [issue tracker](https://github.com/mounir-22/grammar-fixer-pro/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/mounir-22/grammar-fixer-pro/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python api_server.py
```

### Extension Development
1. Load the extension in Chrome Developer Mode
2. Make changes to files in `extension/`
3. Click "Reload" in Chrome extensions page
4. Test your changes

### Code Style

#### Python (Backend)
- Follow PEP 8
- Use type hints where possible
- Add docstrings to functions and classes
- Keep functions focused and small

#### JavaScript (Extension)
- Use modern ES6+ features
- Add comments for complex logic
- Follow consistent naming conventions
- Use async/await for asynchronous operations

### Testing
```bash
cd backend
python test_all_features.py
```

## Feature Requests

We welcome feature requests! Please:
1. Check if the feature already exists
2. Search existing issues to avoid duplicates
3. Clearly describe the feature and its benefits
4. Consider contributing the feature yourself

## License

By contributing, you agree that your contributions will be licensed under the MIT License.