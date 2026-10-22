import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../services/apiConfig';

const AdminUsers = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', role: 'CUSTOMER', brand: 'ZARA', password: 'Vog2026!Premium' });

    const fetchUsers = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/admin/users`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setUsers(data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = (e) => {
        e.preventDefault();
        fetch(`${API_BASE_URL}/api/admin/users/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fetchUsers();
                setShowAddModal(false);
                setNewUser({ email: '', role: 'CUSTOMER', brand: 'ZARA', password: 'Vog2026!Premium' });
            } else {
                alert(data.message || t('admin.users.createFail'));
            }
        })
        .catch(err => {
            console.error('Error adding user:', err);
            alert(t('admin.users.serverError'));
        });
    };

    const deleteUser = (email) => {
        if (!window.confirm(t('admin.users.deleteConfirm').replace('{email}', email))) return;
        fetch(`${API_BASE_URL}/api/admin/users/${email}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fetchUsers();
            } else {
                alert(data.message || t('admin.users.deleteFail'));
            }
        })
        .catch(err => {
            console.error('Error deleting user:', err);
            alert(t('admin.users.deleteError'));
        });
    };

    return (
        <div className="admin-users-premium" style={{ display: 'flex', flexDirection: 'column', gap: '3rem', maxWidth: '1400px', margin: '0 auto', padding: 'var(--container-pad)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="btn-back-premium"
                        style={{ 
                            background: 'var(--glass)', 
                            border: '1px solid var(--glass-border)', 
                            color: 'var(--text-primary)', 
                            padding: '0.8rem 1.8rem', 
                            borderRadius: '100px', 
                            cursor: 'pointer', 
                            fontSize: '0.75rem', 
                            fontWeight: '950',
                            marginBottom: '1.5rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.8rem', 
                            transition: 'var(--transition)', 
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase'
                        }}
                    >
                        ← {t('admin.users.goBack')}
                    </button>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-3px', lineHeight: '1', margin: 0 }}>
                        {t('admin.users.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '700', marginTop: '1rem', letterSpacing: '0.5px' }}>
                        {t('admin.users.subtitle')}
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="btn-action-primary"
                    style={{ 
                        padding: '1.1rem 2.2rem', 
                        borderRadius: '100px', 
                        background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', 
                        color: '#fffffe', 
                        fontWeight: '950', 
                        border: 'none', 
                        cursor: 'pointer', 
                        boxShadow: 'var(--laminar-shadow)', 
                        transition: 'var(--transition)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem'
                    }}
                >
                    + {t('admin.users.addUserBtn')}
                </button>
            </header>

            <div className="glass-card prism-glass" style={{ padding: '0', borderRadius: '3rem', overflow: 'hidden', border: 'var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--laminar-shadow)' }}>
                {loading ? (
                    <div style={{ padding: '10rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '950', letterSpacing: '2px' }}>
                        <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
                        {t('admin.users.loading')}
                    </div>
                ) : (
                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--glass)', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.table.userEmail')}</th>
                                    <th style={{ padding: '2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.table.role')}</th>
                                    <th style={{ padding: '2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.reports.table.type')} / Marka</th>
                                    <th style={{ padding: '2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.table.lastLogin')}</th>
                                    <th style={{ padding: '2rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px', textAlign: 'right', textTransform: 'uppercase' }}>{t('admin.users.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition)' }} className="table-row-hover">
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                                <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                                <div>
                                                    <div style={{ fontWeight: '950', color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '-0.5px' }}>{user.email.split('@')[0].toUpperCase()}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.1rem' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span style={{ 
                                                padding: '0.4rem 1rem', borderRadius: '100px', 
                                                background: user.role === 'ADMIN' ? 'var(--color-info-bg)' : 'var(--accent-soft)', 
                                                color: user.role === 'ADMIN' ? 'var(--color-info)' : 'var(--accent)', 
                                                fontSize: '0.7rem', fontWeight: '950',
                                                border: user.role === 'ADMIN' ? '1px solid var(--color-info)' : '1px solid var(--accent)',
                                                display: 'inline-block'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span style={{ fontWeight: '900', color: 'var(--text-primary)', background: 'var(--glass)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                                                {user.brand}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', color: 'var(--text-secondary)', fontWeight: '750', fontSize: '0.9rem' }}>{user.lastLogin || '-'}</td>
                                        <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => deleteUser(user.email)}
                                                className="btn-delete"
                                                style={{ 
                                                    padding: '0.6rem 1.2rem', 
                                                    borderRadius: '100px', 
                                                    background: 'var(--color-danger-bg)', 
                                                    border: '1px solid var(--color-danger)', 
                                                    color: 'var(--color-danger)', 
                                                    fontWeight: '950', 
                                                    cursor: 'pointer', 
                                                    fontSize: '0.75rem', 
                                                    transition: 'var(--transition)',
                                                    letterSpacing: '0.5px'
                                                }}
                                            >
                                                {t('admin.users.deleteBtn')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem'
                }}>
                    <div className="prism-glass holographic" style={{ width: '100%', maxWidth: '550px', padding: '3rem 2.5rem', borderRadius: '3rem', border: 'var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--laminar-shadow)', position: 'relative' }}>
                        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '2rem', fontWeight: '950', letterSpacing: '-1.5px' }}>{t('admin.users.modal.title')}</h2>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.modal.emailLabel')}</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder={t('admin.users.modal.emailPlaceholder')}
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    className="premium-input"
                                    style={{ width: '100%', padding: '1.1rem 1.3rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '1.2rem', color: 'var(--input-color)', fontWeight: '800', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.modal.passLabel')}</label>
                                <input 
                                    type="password" 
                                    required 
                                    placeholder={t('admin.users.modal.passPlaceholder')}
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    className="premium-input"
                                    style={{ width: '100%', padding: '1.1rem 1.3rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '1.2rem', color: 'var(--input-color)', fontWeight: '800', outline: 'none', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                />
                            </div>
                            <div className="responsive-grid-split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.modal.roleLabel')}</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                        className="premium-select"
                                        style={{ width: '100%', padding: '1.1rem 1.3rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '1.2rem', color: 'var(--input-color)', fontWeight: '900', outline: 'none', cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                    >
                                        <option value="CUSTOMER">{t('admin.users.modal.roleCustomer')}</option>
                                        <option value="ADMIN">{t('admin.users.modal.roleAdmin')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.7rem', fontWeight: '950', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('admin.users.modal.brandLabel')}</label>
                                    <select 
                                        value={newUser.brand}
                                        onChange={e => setNewUser({...newUser, brand: e.target.value})}
                                        className="premium-select"
                                        style={{ width: '100%', padding: '1.1rem 1.3rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '1.2rem', color: 'var(--input-color)', fontWeight: '900', outline: 'none', cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font-main)' }}
                                    >
                                        <option value="ZARA">ZARA</option>
                                        <option value="SEAT">SEAT</option>
                                        <option value="FORD">FORD</option>
                                        <option value="AUDI">AUDI</option>
                                        <option value="VOG">{t('admin.users.modal.brandVog')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mobile-flex-column" style={{ display: 'flex', gap: '1.2rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-modal-cancel" style={{ flex: 1, padding: '1.1rem', borderRadius: '1.2rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)' }}>{t('admin.users.modal.cancelBtn')}</button>
                                <button type="submit" className="btn-modal-submit" style={{ flex: 1, padding: '1.1rem', borderRadius: '1.2rem', background: 'linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)', color: '#fffffe', border: 'none', fontWeight: '950', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--laminar-shadow)' }}>{t('admin.users.modal.createBtn')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .table-row-hover:hover {
                    background: var(--glass) !important;
                }
                .table-responsive {
                    width: 100%;
                    overflow-x: auto;
                }
                .btn-back-premium:hover {
                    background: var(--text-primary) !important;
                    color: var(--midnight) !important;
                    border-color: transparent !important;
                }
                .btn-action-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15) !important;
                }
                .btn-delete:hover {
                    background: var(--color-danger) !important;
                    color: #fffffe !important;
                }
                .premium-input:focus, .premium-select:focus {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 4px var(--accent-soft) !important;
                }
                .btn-modal-cancel:hover {
                    background: var(--text-primary) !important;
                    color: var(--midnight) !important;
                    border-color: transparent !important;
                }
                .btn-modal-submit:hover {
                    opacity: 0.95;
                    transform: translateY(-2px);
                }
                .premium-select option {
                    background: var(--midnight);
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
};

export default AdminUsers;
