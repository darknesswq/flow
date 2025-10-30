import Layout from "./Layout.jsx";

import Home from "./Home";

import BouquetBuilder from "./BouquetBuilder";

import Cart from "./Cart";

import Orders from "./Orders";

import Admin from "./Admin";

import Payment from "./Payment";

import Notifications from "./Notifications";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    BouquetBuilder: BouquetBuilder,
    
    Cart: Cart,
    
    Orders: Orders,
    
    Admin: Admin,
    
    Payment: Payment,
    
    Notifications: Notifications,
    
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
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/BouquetBuilder" element={<BouquetBuilder />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Payment" element={<Payment />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
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