# OneCare Frontend

This directory contains the React frontend for the OneCare Hospital Management System. It is powered by [Vite](https://vitejs.dev/) for fast development and building.

## 🛠️ Setup & Installation

1.  **Navigate to directory**:

    ```bash
    cd frontend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in this directory:

    ```env
    VITE_API_BASE_URL=http://localhost:3001
    ```

4.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` folder. You can test the build locally with:

```bash
npm run preview
```

## 🧩 Key Scripts

- `dev`: Starts local dev server with HMR.
- `build`: Compiles the app for production.
- `lint`: Runs ESLint to check for code quality issues.
- `preview`: Previews the production build locally.

## 🎨 Tech Stack

- **React**: UI Library
- **Vite**: Build Tool
- **React Router**: Navigation
- **Bootstrap**: Styling Framework
- **Axios**: API Requests
- **React Hot Toast**: Notifications
