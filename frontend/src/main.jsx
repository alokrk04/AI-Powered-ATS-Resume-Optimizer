import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import '../index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#10101e',
            color: '#e2e8f0',
            border: '1px solid #1c1c35',
            fontFamily: "'Sora', sans-serif",
            fontSize: '13px',
            borderRadius: '2px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#070710' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#070710' } },
          duration: 4000,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
