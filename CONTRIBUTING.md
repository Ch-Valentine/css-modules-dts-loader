# Contributing to css-modules-dts-loader

Thank you for considering contributing to **css-modules-dts-loader**! Your contributions help make this project better, and we appreciate your time and effort. By contributing, you agree to abide by our guidelines.

## Table of Contents

- [Reporting Issues](#reporting-issues)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Pull Requests](#pull-requests)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
- [License](#license)
- [Contact](#contact)

## Reporting Issues

If you find a bug or encounter any problems, please help us improve the project by reporting the issue on our [GitHub Issues](https://github.com/Ch-Valentine/css-modules-dts-loader/issues) page.

### How to Report an Issue

- **Search**: Before reporting, search the issue tracker to see if the issue has already been reported.
- **Describe the Issue**: Include a clear and descriptive title along with a detailed description of the problem.
- **Steps to Reproduce**: List the steps necessary to reproduce the issue.
- **Expected vs. Actual Behavior**: Explain what you expected to happen and what actually happened.
- **Environment Details**: Provide details such as Node.js version, npm version, operating system, and any other relevant information.
- **Screenshots/Logs**: Attach any screenshots, logs, or error messages that might help diagnose the problem.

## Suggesting Enhancements

We welcome ideas for improvements and new features! If you have a suggestion:

- **Search**: Check the issue tracker to ensure your suggestion hasn’t already been proposed.
- **Open an Issue**: Create a new issue with a clear title and detailed description.
- **Benefits**: Explain the benefits of the enhancement and how it could improve the project.
- **Examples**: Include code samples or design mockups if applicable.

## Pull Requests

Pull requests are how you submit code changes for review. Before submitting a pull request, please follow these steps:

1. **Fork the Repository**:  
   Create a personal fork on GitHub.

2. **Create a Feature Branch**:  
   Create a new branch from `main` (or the designated base branch) for your changes:
   ```bash
   git checkout -b my-new-feature
   ```

3. **Implement Your Changes**:  
   Make sure your changes adhere to the project's coding guidelines. Document any new features or changes as needed.

4. **Commit Your Changes**:  
   Write clear, descriptive commit messages that explain the purpose of your changes. See [Commit Message Guidelines](#commit-message-guidelines) below for more details.

5. **Run Tests**:  
   Ensure that all tests pass before submitting your pull request. If necessary, write new tests to cover your changes.

6. **Submit a Pull Request**:  
   Open a pull request from your feature branch to the main repository's `main` branch. Provide a detailed description of your changes, referencing any related issues.

7. **Respond to Feedback**:  
   The project maintainers may request changes or additional information. Please respond promptly and update your pull request accordingly.

## Coding Guidelines

- **Code Style**: Follow the coding style of the project. If there is no explicit style guide, mimic the style of existing code.
- **Comments**: Write clear, concise comments to explain non-obvious code sections.
- **Documentation**: Update documentation and comments as needed when making changes.
- **Modularity**: Keep changes as modular and isolated as possible to simplify review and integration.

## Commit Message Guidelines

Please use descriptive commit messages. A suggested format is:

```
<type>(<scope>): <subject>

<body>
```

Where:

- **Type**: Indicates the nature of the commit, such as:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation changes
  - `style`: Changes that do not affect the meaning of the code (formatting, etc.)
  - `refactor`: Code refactoring without adding features or fixing bugs
  - `test`: Adding or modifying tests
  - `chore`: Maintenance tasks
- **Scope**: An optional component or module affected (e.g., `loader`, `docs`).
- **Subject**: A brief summary of the change.
- **Body**: (Optional) More detailed explanation of the change.

**Example:**
```
feat(loader): add camelCase conversion option

This commit introduces a new option to convert CSS class names to camelCase in the generated .d.ts file, improving TypeScript integration.
```

## Testing

- **Ensure Tests Pass**: Verify that all existing tests pass before submitting your changes.
- **Write New Tests**: If your changes add new functionality or fix a bug, please include tests that cover the new behavior.
- **Test Environment**: Provide details if specific environment settings or configurations are required for testing.

## License

By contributing to **css-modules-dts-loader**, you agree that your contributions will be licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions, need assistance, or want to discuss your ideas, feel free to open an issue on GitHub or reach out via the repository's contact channels.

---

Thank you for your contributions and for helping make **css-modules-dts-loader** a better project!