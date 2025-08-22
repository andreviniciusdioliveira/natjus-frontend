import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Upload from "./Upload";

import BuscarNotas from "./BuscarNotas";

import Biblioteca from "./Biblioteca";

import Chat from "./Chat";

import Configuracoes from "./Configuracoes";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Upload: Upload,
    
    BuscarNotas: BuscarNotas,
    
    Biblioteca: Biblioteca,
    
    Chat: Chat,
    
    Configuracoes: Configuracoes,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Upload" element={<Upload />} />
                
                <Route path="/BuscarNotas" element={<BuscarNotas />} />
                
                <Route path="/Biblioteca" element={<Biblioteca />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Configuracoes" element={<Configuracoes />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}