import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "12px",
          background: "#0D1526",
          color: "#EAF0FF",
          border: "1px solid #1C2740",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
        },
      }}
    />
  </StrictMode>,
)
