import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { BidsProvider } from './context/BidsContext'
import { GigsProvider } from './context/GigsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <GigsProvider>
                <BidsProvider> 
                    <App />
                </BidsProvider>
            </GigsProvider>
        </AuthProvider>
  </React.StrictMode>,
)