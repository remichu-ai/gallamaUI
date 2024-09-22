import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import TestChatComponent from "./mock/TestChatComponent.jsx";
import Main from "./page/Main.jsx";


// Use an environment variable or a global flag to determine which component to render
const isTestingEnvironment = import.meta.env.VITE_TESTING === 'true'

// main component
ReactDOM.createRoot(document.getElementById('root')).render(
    // comment out strict mode as it make thing hard to debug
    // <React.StrictMode>
    <>
        {isTestingEnvironment ? <TestChatComponent/> : <Main/>}
    </>
    // </React.StrictMode>,
)

