# 🤝 Contributing Guide

Guidelines for contributing to the OneCare Hospital Management System.

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/Hospital_Management_System_.git
cd Hospital_Management_System_
```

### 2. Setup Environment

See `DEVELOPMENT_SETUP.md` for detailed instructions.

### 3. Create Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

---

## 📁 Project Structure

Before contributing, familiarize yourself with:

- `docs/FILE_STRUCTURE.md` - Complete file breakdown
- `docs/ARCHITECTURE.md` - System design
- `README.md` - Project overview

---

## 💻 Development Guidelines

### Code Style

**JavaScript/React**:

- Use ES6+ syntax
- Prefer `const` over `let`
- Use async/await over callbacks
- Destructure objects where appropriate

```javascript
// ✅ Good
const { data } = await axios.get(url);
const { name, email } = user;

// ❌ Avoid
var data = (await axios.get(url)).data;
```

**Naming Conventions**:

- **Files**: PascalCase for components (`PatientList.jsx`), camelCase for utilities (`formatDate.js`)
- **Variables**: camelCase (`isLoading`, `userData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Components**: PascalCase (`PatientCard`)

---

### Backend Guidelines

1. **Route Organization**:

   - One file per domain (`patientRoutes.js`, `billingRoutes.js`)
   - Use router prefix in `index.js`

2. **Error Handling**:

   ```javascript
   try {
     // logic
   } catch (err) {
     logger.error("Context", { error: err.message });
     res.status(500).json({ message: "User-friendly message" });
   }
   ```

3. **Authentication**:

   - Always use `verifyToken` middleware for protected routes
   - Check `req.user.role` for authorization

4. **Database**:
   - Always validate ObjectIds
   - Use lean() for read-only queries
   - Always scope queries by clinicId for non-admin users

---

### Frontend Guidelines

1. **Component Structure**:

   ```jsx
   // Imports
   import React, { useState, useEffect } from "react";
   import axios from "axios";

   // Component
   const MyComponent = ({ prop1, prop2 }) => {
     // State
     const [data, setData] = useState([]);

     // Effects
     useEffect(() => {
       fetchData();
     }, []);

     // Handlers
     const handleClick = () => {};

     // Render
     return <div>{/* JSX */}</div>;
   };

   export default MyComponent;
   ```

2. **API Calls**:

   - Always use `API_BASE` from config
   - Include error handling
   - Show loading states

3. **State Management**:
   - Use React hooks (useState, useEffect, useContext)
   - Avoid prop drilling; use context for shared state

---

## 🧪 Testing

Before submitting:

1. Test your changes locally
2. Test with different user roles
3. Test edge cases (empty data, errors)
4. Check browser console for errors

---

## 📝 Commit Messages

Use conventional commits:

```
feat: add patient search functionality
fix: resolve date formatting issue in appointments
docs: update API documentation
style: format billing components
refactor: simplify authentication logic
```

Format: `type: description`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructure (no feature change)
- `test`: Adding tests
- `chore`: Maintenance tasks

---

## 🔄 Pull Request Process

1. **Before Submitting**:

   - Pull latest from main branch
   - Resolve any conflicts
   - Ensure code runs without errors
   - Update documentation if needed

2. **PR Description**:

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update

   ## Testing

   How did you test this?

   ## Screenshots (if UI changes)
   ```

3. **Review Process**:
   - Wait for review
   - Address feedback
   - Squash commits if requested

---

## 📚 Documentation

When adding features:

1. Update relevant docs in `docs/` folder
2. Add JSDoc comments for complex functions
3. Update README if adding new capabilities

---

## 🐛 Reporting Bugs

Include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/logs
5. Environment (browser, OS)

---

## 💡 Feature Requests

Include:

1. Use case description
2. Proposed solution
3. Alternative approaches considered
4. Mockups (if UI-related)

---

## 📞 Getting Help

- Check existing documentation
- Search closed issues
- Ask in discussions
- Create an issue with questions

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication
