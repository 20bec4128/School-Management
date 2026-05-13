import React, { useState, useMemo } from 'react';
import '../assets/css/addModalShared.css';

const emptySaleInfo = {
    userType: '',
    saleTo: '',
    incomeHead: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
};

const emptyItem = {
    category: '',
    product: '',
    quantity: 0,
    unitPrice: 0,
  subtotal: 0
};

const FIELD_ICONS = {
    'User Type': 'ri-user-settings-line',
    'Sale To': 'ri-user-3-line',
    'Income Head': 'ri-wallet-3-line',
    Date: 'ri-calendar-line',
    Note: 'ri-sticky-note-line',
    'Category': 'ri-list-settings-line',
    'Product': 'ri-shopping-bag-line',
    'Quantity': 'ri-equalizer-line',
    'Unit Price': 'ri-money-dollar-circle-line',
    'Paid Status': 'ri-checkbox-circle-line',
    Discount: 'ri-discount-line',
};

const FormField = ({ label, required, children, full = false }) => {
    const icon = FIELD_ICONS[label] || 'ri-edit-line';
    return (
        <div className={`avm-field${full ? ' full' : ''}`}>
            <label className="avm-label">
                {label}
                {required && <span className="req"> *</span>}
            </label>
            <div className="avm-input-with-icon" style={{ position: 'relative' }}>
                <span style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#667085',
                    fontSize: '0.95rem',
                    zIndex: 1,
                }}>
                    <i className={icon}></i>
                </span>
                {children}
            </div>
        </div>
    );
};

const SaleCreate = ({ onNavigate }) => {
    const [saleInfo, setSaleInfo] = useState(emptySaleInfo);
    const [items, setItems] = useState([{ ...emptyItem, id: Date.now() }]);
    const [payment, setPayment] = useState({ paidStatus: '', discount: 0 });

    /**
     * 1. Dynamic Item Logic
     */
    const addItem = () => {
        setItems([...items, { ...emptyItem, id: Date.now() }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
                }
                return updatedItem;
            }
            return item;
        });
        setItems(updatedItems);
    };

    /**
     * 2. Financial Calculations
     */
    const totals = useMemo(() => {
        const gross = items.reduce((sum, item) => sum + item.subtotal, 0);
        const net = gross - (Number(payment.discount) || 0);
        return { gross, net };
    }, [items, payment.discount]);

    return (
        <div className="dashboard-main-body">
            <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
                <h1 className="fw-semibold mb-0 h6 text-primary-light">Add New Sale</h1>
                    <button
                        type="button"
                        className="btn btn-outline-neutral border border-neutral-300 radius-8 text-sm"
                        onClick={() => (onNavigate ? onNavigate('sale') : window.history.back())}
                    >
                    <i className="ri-arrow-left-line"></i> Back to List
                </button>
            </div>

            {/* Section 1: Sale Information */}
            <div className="card mb-24">
                <div className="card-header border-bottom border-neutral-200">
                    <h6 className="text-md fw-semibold mb-0">Sale Information</h6>
                </div>
                <div className="card-body">
                    <div className="row gy-20">
                        <div className="col-md-4">
                            <FormField label="User Type" required>
                                <select className="avm-select" value={saleInfo.userType} onChange={(e) => setSaleInfo({...saleInfo, userType: e.target.value})}>
                                    <option value="">--Select--</option>
                                    <option>Student</option>
                                    <option>Staff</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="col-md-4">
                            <FormField label="Sale To" required>
                                <select className="avm-select" value={saleInfo.saleTo}>
                                    <option value="">--Select--</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="col-md-4">
                            <FormField label="Income Head" required>
                                <select className="avm-select" value={saleInfo.incomeHead}>
                                    <option value="">--Select--</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="col-md-4">
                            <FormField label="Date" required>
                                <input type="date" className="avm-input" value={saleInfo.date} />
                            </FormField>
                        </div>
                        <div className="col-md-8">
                            <FormField label="Note">
                                <input type="text" className="avm-input" placeholder="Enter note..." />
                            </FormField>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Item Information */}
            <div className="card mb-24">
                <div className="card-header border-bottom border-neutral-200 d-flex justify-content-between align-items-center">
                    <h6 className="text-md fw-semibold mb-0">Item Information</h6>
                    <button className="btn btn-sm btn-primary-600 radius-8" onClick={addItem}>
                        <i className="ri-add-line"></i> Add Row
                    </button>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-bordered mb-0">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="text-center" style={{ width: '60px' }}>S.L</th>
                                    <th>Category</th>
                                    <th>Product</th>
                                    <th style={{ width: '120px' }}>Quantity</th>
                                    <th style={{ width: '150px' }}>Unit Price</th>
                                    <th style={{ width: '150px' }}>Subtotal</th>
                                    <th className="text-center" style={{ width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="text-center align-middle">{index + 1}</td>
                                        <td>
                                            <select className="form-select border-0 bg-transparent" onChange={(e) => updateItem(item.id, 'category', e.target.value)}>
                                                <option>--Select--</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select className="form-select border-0 bg-transparent" onChange={(e) => updateItem(item.id, 'product', e.target.value)}>
                                                <option>--Select--</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="number" className="form-control border-0 bg-transparent" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="form-control border-0 bg-transparent" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} />
                                        </td>
                                        <td className="align-middle fw-medium text-primary-light">
                                            {item.subtotal.toFixed(2)}
                                        </td>
                                        <td className="text-center align-middle">
                                            <button className="text-danger-600 bg-danger-focus rounded-circle w-32-px h-32-px border-0" onClick={() => removeItem(item.id)}>
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 3: Payment & Finalization */}
            <div className="row">
                <div className="col-xl-6 offset-xl-6">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-grid gap-16">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-secondary-light">Gross Total</span>
                                    <span className="fw-semibold text-primary-light">{totals.gross.toFixed(2)}</span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-24">
                                    <span className="text-secondary-light">Discount</span>
                                    <input 
                                        type="number" 
                                        className="form-control text-end w-150-px" 
                                        value={payment.discount} 
                                        onChange={(e) => setPayment({...payment, discount: e.target.value})} 
                                    />
                                </div>
                                <hr className="border-neutral-200" />
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-lg fw-bold text-primary-light">Grand Total</span>
                                    <span className="text-lg fw-bold text-primary-600">{totals.net.toFixed(2)}</span>
                                </div>
                                <div className="mt-16">
                                    <FormField label="Paid Status" required>
                                        <select className="avm-select" value={payment.paidStatus} onChange={(e) => setPayment({...payment, paidStatus: e.target.value})}>
                                            <option value="">--Select--</option>
                                            <option>Paid</option>
                                            <option>Unpaid</option>
                                            <option>Partial</option>
                                        </select>
                                    </FormField>
                                </div>
                                <button type="button" className="btn btn-primary-600 w-100 py-12 mt-16 radius-8" onClick={() => onNavigate?.('sale')}>
                                    Complete Sale
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleCreate;
