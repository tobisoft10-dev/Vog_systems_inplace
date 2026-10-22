import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import CustomerLayout from './components/CustomerLayout';
import Home from './pages/Home';
import About from './pages/About';
import ProductsPage from './pages/ProductsPage';
import Sustainability from './pages/Sustainability';
import News from './pages/News';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Gallery from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import CEODashboard from './pages/CEODashboard';
import OrdersPage from './pages/OrdersPage';
import OrderForm from './pages/OrderForm';

import LoginPage from './pages/LoginPage';
import CustomersPage from './pages/CustomersPage';
import ProductCatalog from './pages/ProductCatalog';
import AdminReports from './pages/AdminReports';
import AdminDataEntry from './pages/AdminDataEntry';
import FulfillmentCenter from './pages/FulfillmentCenter';
import HandheldTerminal from './pages/HandheldTerminal';
import AdminSettings from './pages/AdminSettings';
import HardwareDashboard from './pages/HardwareDashboard';
import SeatOrderManagement from './pages/SeatOrderManagement';
import SeatReportGenerator from './pages/SeatReportGenerator';
import WebServiceTerminal from './pages/WebServiceTerminal';
import AdminUsers from './pages/AdminUsers';
import PersonnelOperationsHub from './pages/PersonnelOperationsHub';
import PersonnelOrderManagement from './pages/PersonnelOrderManagement';
import PersonnelSorterWorkflowPage from './pages/PersonnelSorterWorkflowPage';

// Customer Portal Pages
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerOrders from './pages/CustomerOrders';
import SubCustomerManagement from './pages/SubCustomerManagement';
import CustomerOrderForm from './pages/CustomerOrderForm';
import AIVisualizer from './pages/AIVisualizer';
import CustomerCatalog from './pages/CustomerCatalog';
import CustomerShipmentTracking from './pages/CustomerShipmentTracking';
import AdminTunnelMonitor from './pages/AdminTunnelMonitor';
import ProductLabelPrinting from './pages/ProductLabelPrinting';
import BoxLabelPrinting from './pages/BoxLabelPrinting';
import BoxLabelAutoPrint from './pages/BoxLabelAutoPrint';
import HandheldDemoAnimation from './pages/HandheldDemoAnimation';
import TunnelKioskPage from './pages/TunnelKioskPage';
import ApkDownloadPage from './pages/ApkDownloadPage';
import OrderLabelPrintingPage from './pages/OrderLabelPrintingPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
        <Route path="/sustainability" element={<Layout><Sustainability /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/faq" element={<Layout><FAQ /></Layout>} />
        <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/animasyon" element={<HandheldDemoAnimation />} />
        <Route path="/tesellum-demo" element={<HandheldDemoAnimation />} />
        <Route path="/apk" element={<ApkDownloadPage />} />
        <Route path="/download" element={<ApkDownloadPage />} />
        <Route path="/indir" element={<ApkDownloadPage />} />
        <Route path="/terminal-apk" element={<ApkDownloadPage />} />
        <Route path="/download-terminal" element={<ApkDownloadPage />} />

        {/* Customer Portal Routes */}
        <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerDashboard /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/orders" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerOrders /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/catalog" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerCatalog /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/new-order" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerOrderForm /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/subs" element={<ProtectedRoute role="customer"><CustomerLayout><SubCustomerManagement /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/visualizer" element={<ProtectedRoute role="customer"><CustomerLayout><AIVisualizer /></CustomerLayout></ProtectedRoute>} />
        <Route path="/customer/tracking" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerShipmentTracking /></CustomerLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/ceo" element={<ProtectedRoute role="admin"><AdminLayout><CEODashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminLayout><OrdersPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders/new" element={<ProtectedRoute role="admin"><AdminLayout><OrderForm /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders/:orderId/labels" element={<ProtectedRoute role="admin"><AdminLayout><OrderLabelPrintingPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders/label-print/:orderId" element={<ProtectedRoute role="admin"><AdminLayout><OrderLabelPrintingPage /></AdminLayout></ProtectedRoute>} />

        <Route path="/admin/customers" element={<ProtectedRoute role="admin"><AdminLayout><CustomersPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/catalog" element={<ProtectedRoute role="admin"><AdminLayout><ProductCatalog /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/data-entry" element={<ProtectedRoute role="admin"><AdminLayout><AdminDataEntry /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/fulfillment" element={<ProtectedRoute role="admin"><AdminLayout><FulfillmentCenter /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/handheld" element={<ProtectedRoute role="admin"><HandheldTerminal /></ProtectedRoute>} />
        <Route path="/terminal" element={<HandheldTerminal />} />
        <Route path="/pda" element={<HandheldTerminal />} />
        <Route path="/admin/iot" element={<ProtectedRoute role="admin"><AdminLayout><HardwareDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/personnel" element={<ProtectedRoute role="admin"><AdminLayout><PersonnelOrderManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/personnel-orders" element={<ProtectedRoute role="admin"><AdminLayout><PersonnelOrderManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/personnel-hub" element={<ProtectedRoute role="admin"><AdminLayout><PersonnelOperationsHub /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/personnel-workflow" element={<ProtectedRoute role="admin"><AdminLayout><PersonnelSorterWorkflowPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/personnel-sorter-flow" element={<ProtectedRoute role="admin"><AdminLayout><PersonnelSorterWorkflowPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/seat" element={<ProtectedRoute role="admin"><AdminLayout><SeatOrderManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/seat-report-generator" element={<ProtectedRoute role="admin"><AdminLayout><SeatReportGenerator /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/tunnel" element={<ProtectedRoute role="admin"><AdminLayout><AdminTunnelMonitor /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/tunnel-kiosk" element={<ProtectedRoute role="admin"><TunnelKioskPage /></ProtectedRoute>} />
        <Route path="/kiosk" element={<TunnelKioskPage />} />
        <Route path="/tunnel-kiosk" element={<TunnelKioskPage />} />
        <Route path="/admin/terminal" element={<ProtectedRoute role="admin"><AdminLayout><WebServiceTerminal /></AdminLayout></ProtectedRoute>} />

        <Route path="/admin/product-labels" element={<ProtectedRoute role="admin"><AdminLayout><ProductLabelPrinting /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/box-labels" element={<ProtectedRoute role="admin"><AdminLayout><BoxLabelPrinting /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/box-labels/auto" element={<ProtectedRoute role="admin"><AdminLayout><BoxLabelAutoPrint /></AdminLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;




