import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  PhoneCall,
  Download,
  ShieldCheck,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Database,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Sparkles,
  ShieldAlert,
  Phone,
  Calendar,
  FileText,
  Lock,
  ArrowRight,
  Check,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  RotateCcw,
  ListFilter,
  Layers
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('breakbot_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('breakbot_user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('AdminPassword123!');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Master customers state
  const [masterRecords, setMasterRecords] = useState([]);
  const [masterPagination, setMasterPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [masterSearch, setMasterSearch] = useState('');
  const [masterEligibility, setMasterEligibility] = useState('');
  const [masterStatus, setMasterStatus] = useState('');
  const [masterProcessingStatus, setMasterProcessingStatus] = useState('');
  const [masterOverrideOnly, setMasterOverrideOnly] = useState(false);
  const [masterLoading, setMasterLoading] = useState(false);

  // Customer Detail Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);

  // Override Modal state
  const [overrideCustomer, setOverrideCustomer] = useState(null);
  const [overrideValue, setOverrideValue] = useState('Yes');
  const [overrideReason, setOverrideReason] = useState('');

  // Daily uploads state
  const [dailyHistory, setDailyHistory] = useState([]);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [usernameCol, setUsernameCol] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');
  const [uploadingDaily, setUploadingDaily] = useState(false);

  // Stage 1 Review & Items State
  const [viewingUploadBatch, setViewingUploadBatch] = useState(null);
  const [uploadItems, setUploadItems] = useState([]);
  const [uploadItemsPagination, setUploadItemsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [itemSearch, setItemSearch] = useState('');
  const [itemFinalEligibilityFilter, setItemFinalEligibilityFilter] = useState('');
  const [itemMasterStatusFilter, setItemMasterStatusFilter] = useState('');

  // Stage 2 Confirmation Modal State
  const [confirmSummary, setConfirmSummary] = useState(null);
  const [confirmingBatch, setConfirmingBatch] = useState(false);

  // Export dropdown state for active batch
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Calling queue state
  const [queueItems, setQueueItems] = useState([]);
  const [queuePagination, setQueuePagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatus, setQueueStatus] = useState('');
  const [queueFollowUpOnly, setQueueFollowUpOnly] = useState(false);
  const [callModalCustomer, setCallModalCustomer] = useState(null);
  const [callStatus, setCallStatus] = useState('Accepted offer');
  const [callOfferResult, setCallOfferResult] = useState('Accepted');
  const [callNotes, setCallNotes] = useState('');
  const [callFollowUpDate, setCallFollowUpDate] = useState('');

  // Admin state
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, totalPages: 1 });
  const [backupsList, setBackupsList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');

  // Helper Toast
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth fetch helper
  const apiFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request Failed');
    }
    return data;
  };

  // Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('breakbot_token', data.token);
      localStorage.setItem('breakbot_user', JSON.stringify(data.user));
      showToast(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('breakbot_token');
    localStorage.removeItem('breakbot_user');
    showToast('Logged out successfully.', 'info');
  };

  // Fetch Dashboard
  const loadDashboard = async () => {
    setDashboardLoading(true);
    try {
      const data = await apiFetch('/dashboard');
      setDashboardData(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch Master Records
  const loadMaster = async (page = 1) => {
    setMasterLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search: masterSearch,
        eligibility: masterEligibility,
        contactStatus: masterStatus,
        processingStatus: masterProcessingStatus,
        overrideOnly: masterOverrideOnly
      });
      const data = await apiFetch(`/master?${params.toString()}`);
      setMasterRecords(data.records);
      setMasterPagination(data.pagination);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMasterLoading(false);
    }
  };

  // Fetch Customer Details
  const loadCustomerDetail = async (id) => {
    try {
      const data = await apiFetch(`/master/${id}`);
      setCustomerDetail(data);
      setSelectedCustomerId(id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save Master Override
  const handleSaveOverride = async () => {
    if (!overrideCustomer) return;
    try {
      await apiFetch(`/master/${overrideCustomer.id}/override`, {
        method: 'POST',
        body: JSON.stringify({ override: overrideValue, reason: overrideReason })
      });
      showToast(`Override saved for ${overrideCustomer.username}`);
      setOverrideCustomer(null);
      setOverrideReason('');
      loadMaster(masterPagination.page);
      if (selectedCustomerId === overrideCustomer.id) loadCustomerDetail(overrideCustomer.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Daily File Preview
  const handleDailyFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedUploadFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiFetch('/daily/preview', {
        method: 'POST',
        body: formData
      });
      setPreviewData(data);
      setUsernameCol(data.suggestedUsernameCol || '');
      setNameCol(data.suggestedNameCol || '');
      setPhoneCol(data.suggestedPhoneCol || '');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Stage 1: Process Daily File as Draft
  const handleProcessDaily = async () => {
    if (!previewData || !usernameCol) {
      showToast('Please select the Username column', 'error');
      return;
    }
    setUploadingDaily(true);
    try {
      const res = await apiFetch('/daily/process', {
        method: 'POST',
        body: JSON.stringify({
          fileId: previewData.fileId,
          originalName: previewData.originalName,
          usernameCol,
          nameCol,
          phoneCol
        })
      });
      showToast(`Daily file uploaded as Draft (${res.summary.totalRows} rows). Master list was NOT modified.`);
      setPreviewData(null);
      setSelectedUploadFile(null);
      loadDailyHistory();
      loadDailyItems(res.uploadId, 1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingDaily(false);
    }
  };

  // Load Daily History
  const loadDailyHistory = async () => {
    try {
      const data = await apiFetch('/daily/history');
      setDailyHistory(data.uploads);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Load Daily Upload Items for Stage 1 Review
  const loadDailyItems = async (uploadId, page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        search: itemSearch,
        finalEligibility: itemFinalEligibilityFilter,
        masterStatus: itemMasterStatusFilter
      });
      const data = await apiFetch(`/daily/history/${uploadId}?${params.toString()}`);
      setViewingUploadBatch(data.uploadRecord);
      setUploadItems(data.items);
      setUploadItemsPagination(data.pagination);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Stage 1 Item Review: Update Item Override, Selection, or Notes
  const handleUpdateItem = async (itemId, updates) => {
    try {
      const res = await apiFetch(`/daily/item/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setUploadItems(items => items.map(it => it.id === itemId ? res.item : it));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Stage 1 Selection Options
  const handleBatchSelect = async (option) => {
    if (!viewingUploadBatch) return;
    try {
      await apiFetch(`/daily/batch-select/${viewingUploadBatch.id}`, {
        method: 'POST',
        body: JSON.stringify({ option })
      });
      showToast('Selection updated');
      loadDailyItems(viewingUploadBatch.id, uploadItemsPagination.page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Stage 2 Confirmation Window Trigger
  const handleOpenConfirmModal = async (batchId) => {
    try {
      const summary = await apiFetch(`/daily/pre-confirm-summary/${batchId}`);
      setConfirmSummary(summary);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Stage 2 Execution: Confirm & Mark Done in Master List
  const handleExecuteConfirm = async () => {
    if (!confirmSummary) return;
    setConfirmingBatch(true);
    try {
      const res = await apiFetch(`/daily/confirm/${confirmSummary.uploadId}`, { method: 'POST' });
      showToast(`Confirmed! ${res.updatedCount} master customer records marked Done.`);
      setConfirmSummary(null);
      loadDailyHistory();
      loadDailyItems(confirmSummary.uploadId, 1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmingBatch(false);
    }
  };

  // Admin: Undo Confirmed Batch
  const handleUndoBatch = async (batchId) => {
    if (!confirm('Are you sure you want to undo this confirmed batch? This will restore updated master customers back to "Not Done".')) return;
    try {
      const res = await apiFetch(`/daily/undo/${batchId}`, { method: 'POST' });
      showToast(`Batch undone. ${res.revertedCount} master records restored to Not Done.`);
      loadDailyHistory();
      if (viewingUploadBatch && viewingUploadBatch.id === batchId) {
        loadDailyItems(batchId, 1);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Load Calling Queue
  const loadQueue = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search: queueSearch,
        status: queueStatus,
        followUpOnly: queueFollowUpOnly
      });
      const data = await apiFetch(`/calls/queue?${params.toString()}`);
      setQueueItems(data.items);
      setQueuePagination(data.pagination);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Record Call Outcome
  const handleRecordCall = async () => {
    if (!callModalCustomer) return;
    try {
      await apiFetch('/calls/record', {
        method: 'POST',
        body: JSON.stringify({
          customerId: callModalCustomer.id,
          contactStatus: callStatus,
          offerResult: callOfferResult,
          notes: callNotes,
          followUpDate: callFollowUpDate || null
        })
      });
      showToast(`Call recorded for ${callModalCustomer.customer_name}`);
      setCallModalCustomer(null);
      setCallNotes('');
      setCallFollowUpDate('');
      loadQueue(queuePagination.page);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Admin Data Load
  const loadAdminData = async () => {
    try {
      const usersData = await apiFetch('/auth/users');
      setUsersList(usersData.users);

      const auditData = await apiFetch('/audit');
      setAuditLogs(auditData.logs);
      setAuditPagination(auditData.pagination);

      const backupData = await apiFetch('/backups');
      setBackupsList(backupData.backups);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUserUsername,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole
        })
      });
      showToast(`Created user ${newUserUsername}`);
      setShowUserModal(false);
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserName('');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Backup
  const handleCreateBackup = async () => {
    try {
      const data = await apiFetch('/backups/create', { method: 'POST' });
      showToast(`Backup created: ${data.filename}`);
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Trigger tab data loads
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'master') loadMaster();
    if (activeTab === 'daily') loadDailyHistory();
    if (activeTab === 'queue') loadQueue();
    if (activeTab === 'admin' && user?.role === 'admin') loadAdminData();
  }, [activeTab, token]);

  if (!token || !user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Sparkles size={32} />
            </div>
            <h1 className="page-title">Breakbot System</h1>
            <p className="page-subtitle">Customer Offer & Expiration Management Platform</p>
          </div>

          {loginError && <div className="error-alert">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Demo Accounts:</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setLoginUsername('admin'); setLoginPassword('AdminPassword123!'); }}
              >
                Admin (admin)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setLoginUsername('john_caller'); setLoginPassword('Caller123!'); }}
              >
                Caller (john_caller)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 1000,
            backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: '#fff',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Main Header */}
      <header className="header">
        <div className="logo-group">
          <div className="logo-badge">
            <Sparkles size={20} /> Breakbot
          </div>
          <div>
            <div className="logo-title">Customer Offer System</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'master' ? 'active' : ''}`}
            onClick={() => setActiveTab('master')}
          >
            <Users size={16} /> Master Directory
          </button>
          <button
            className={`nav-item ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <UploadCloud size={16} /> Daily Expirations
          </button>
          <button
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <PhoneCall size={16} /> Calling Queue
          </button>
          <button
            className={`nav-item ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={16} /> Exports & Reports
          </button>
          {user.role === 'admin' && (
            <button
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={16} /> Admin & Logs
            </button>
          )}
        </nav>

        <div className="user-profile">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user.name}</div>
            <span className={`user-badge ${user.role}`}>{user.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Executive Dashboard</h1>
                <p className="page-subtitle">Real-time overview of customer offer eligibility, two-stage processing, and calls</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadDashboard} disabled={dashboardLoading}>
                <RefreshCw size={14} className={dashboardLoading ? 'spin' : ''} /> Refresh Stats
              </button>
            </div>

            {dashboardData && (
              <>
                <div className="grid-4">
                  <div className="card metric-card">
                    <div>
                      <div className="metric-label">Master Records</div>
                      <div className="metric-value">{dashboardData.master.totalRecords}</div>
                    </div>
                    <div className="metric-icon icon-blue"><Users size={24} /></div>
                  </div>

                  <div className="card metric-card">
                    <div>
                      <div className="metric-label">Uploaded Today</div>
                      <div className="metric-value">{dashboardData.todayUploads.uploadedToday}</div>
                    </div>
                    <div className="metric-icon icon-cyan"><UploadCloud size={24} /></div>
                  </div>

                  <div className="card metric-card">
                    <div>
                      <div className="metric-label">Calls Completed Today</div>
                      <div className="metric-value">{dashboardData.calling.callsCompletedToday}</div>
                    </div>
                    <div className="metric-icon icon-purple"><PhoneCall size={24} /></div>
                  </div>

                  <div className="card metric-card">
                    <div>
                      <div className="metric-label">Accepted Offers</div>
                      <div className="metric-value">{dashboardData.calling.acceptedOffers}</div>
                    </div>
                    <div className="metric-icon icon-green"><CheckCircle2 size={24} /></div>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileSpreadsheet size={18} className="icon-blue" /> Today's Upload Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Automatic Eligible</span>
                        <span className="mono-text" style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
                          {dashboardData.todayUploads.eligibleToday}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Not Eligible</span>
                        <span className="mono-text" style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>
                          {dashboardData.todayUploads.notEligibleToday}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Duplicates Flagged</span>
                        <span className="mono-text" style={{ color: 'var(--accent-warning)', fontWeight: 700 }}>
                          {dashboardData.todayUploads.duplicateUsernames}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Manual Overrides Active</span>
                        <span className="mono-text" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                          {dashboardData.master.manuallyOverridden}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PhoneCall size={18} className="icon-purple" /> Calling Campaign Status
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Already Contacted</span>
                        <span className="mono-text" style={{ fontWeight: 700 }}>{dashboardData.calling.alreadyContacted}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Queue Pending Call</span>
                        <span className="mono-text" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {dashboardData.calling.notYetCalled}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Interested Customers</span>
                        <span className="mono-text" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                          {dashboardData.calling.interestedCustomers}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Follow-ups Due Today</span>
                        <span className="mono-text" style={{ color: 'var(--accent-warning)', fontWeight: 700 }}>
                          {dashboardData.calling.followupsDueToday}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={18} className="icon-green" /> Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <button className="btn btn-primary" onClick={() => setActiveTab('daily')}>
                        <UploadCloud size={16} /> Stage 1: Upload & Review Daily Expirations
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('queue')}>
                        <PhoneCall size={16} /> Open Calling Queue
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('master')}>
                        <Users size={16} /> Browse Master Customer List
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* MASTER DIRECTORY TAB */}
        {activeTab === 'master' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Master Customer Directory</h1>
                <p className="page-subtitle">Unified 22,000+ customer records with automatic eligibility, manual overrides, and Done status</p>
              </div>
            </div>

            <div className="filter-bar">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Search Record</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.2rem' }}
                    placeholder="Search name, username, phone, or record ID..."
                    value={masterSearch}
                    onChange={e => setMasterSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadMaster(1)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Final Eligibility</label>
                <select
                  className="form-select"
                  value={masterEligibility}
                  onChange={e => setMasterEligibility(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Yes">Eligible (Yes)</option>
                  <option value="No">Ineligible (No)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Processing Status</label>
                <select
                  className="form-select"
                  value={masterProcessingStatus}
                  onChange={e => setMasterProcessingStatus(e.target.value)}
                >
                  <option value="">All Processing Statuses</option>
                  <option value="Not Done">Not Done</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                <input
                  type="checkbox"
                  id="overrideOnly"
                  checked={masterOverrideOnly}
                  onChange={e => setMasterOverrideOnly(e.target.checked)}
                />
                <label htmlFor="overrideOnly" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Overridden Only</label>
              </div>

              <button className="btn btn-primary" style={{ marginTop: '1.2rem' }} onClick={() => loadMaster(1)}>
                <Filter size={16} /> Apply Filters
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Customer Name</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Auto Eligibility</th>
                    <th>Manual Override</th>
                    <th>Final Result</th>
                    <th>Processing Status</th>
                    <th>Contact Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {masterRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No master records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    masterRecords.map(r => (
                      <tr key={r.id}>
                        <td className="mono-text" style={{ fontWeight: 600 }}>{r.record_id}</td>
                        <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                        <td className="mono-text" style={{ color: 'var(--accent-primary)' }}>{r.username}</td>
                        <td>{r.phone_number || 'N/A'}</td>
                        <td>
                          <span className={`badge ${r.offer_eligibility === 'Yes' ? 'badge-yes' : 'badge-no'}`}>
                            {r.offer_eligibility}
                          </span>
                        </td>
                        <td>
                          {r.manual_override ? (
                            <span className="badge badge-purple" title={r.manual_override_reason}>
                              Overridden: {r.manual_override}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${r.final_eligibility === 'Yes' ? 'badge-yes' : 'badge-no'}`}>
                            {r.final_eligibility}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${r.processing_status === 'Done' ? 'badge-yes' : 'badge-warning'}`}>
                            {r.processing_status === 'Done' ? '✓ Done' : 'Not Done'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            r.contact_status === 'Accepted offer' ? 'badge-yes' :
                            r.contact_status === 'Declined offer' ? 'badge-no' :
                            r.contact_status === 'Interested' ? 'badge-info' : 'badge-warning'
                          }`}>
                            {r.contact_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => loadCustomerDetail(r.id)}
                              title="View History & Details"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setOverrideCustomer(r);
                                setOverrideValue(r.manual_override || 'Yes');
                                setOverrideReason(r.manual_override_reason || '');
                              }}
                              title="Manual Override"
                            >
                              <Edit3 size={14} /> Override
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination">
                <div>Showing page {masterPagination.page} of {masterPagination.totalPages} ({masterPagination.total} records)</div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={masterPagination.page <= 1}
                    onClick={() => loadMaster(masterPagination.page - 1)}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={masterPagination.page >= masterPagination.totalPages}
                    onClick={() => loadMaster(masterPagination.page + 1)}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DAILY EXPIRATIONS & TWO-STAGE WORKFLOW TAB */}
        {activeTab === 'daily' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Daily Expirations (Two-Stage Workflow)</h1>
                <p className="page-subtitle">Stage 1: Upload & Review Draft | Stage 2: Confirm & Mark Done in Master List</p>
              </div>
            </div>

            {/* STAGE 1: Upload Box */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud className="icon-blue" size={22} /> Stage 1 — Upload Expiration File
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Uploading processes the file as a <strong>Draft batch</strong>. It does NOT modify the master customer list until confirmed in Stage 2.
              </p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="file"
                  id="dailyFileInput"
                  style={{ display: 'none' }}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleDailyFileSelect}
                />
                <label htmlFor="dailyFileInput" className="btn btn-primary">
                  <FileSpreadsheet size={18} /> Choose Excel / CSV File
                </label>
                {selectedUploadFile && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Selected: {selectedUploadFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* STAGE 1 & 2: Active Review Batch Section */}
            {viewingUploadBatch && (
              <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className={`badge ${viewingUploadBatch.status === 'confirmed' ? 'badge-yes' : 'badge-warning'}`} style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      Status: {viewingUploadBatch.status.toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      Batch #{viewingUploadBatch.id}: {viewingUploadBatch.file_name}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Uploaded by {viewingUploadBatch.uploaded_by} on {new Date(viewingUploadBatch.upload_date).toLocaleString()} ({viewingUploadBatch.total_rows} rows)
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {viewingUploadBatch.status === 'draft' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem' }}
                        onClick={() => handleOpenConfirmModal(viewingUploadBatch.id)}
                      >
                        <CheckCircle2 size={18} /> Confirm and Mark Done in Master List
                      </button>
                    )}

                    {viewingUploadBatch.status === 'confirmed' && user.role === 'admin' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleUndoBatch(viewingUploadBatch.id)}
                      >
                        <RotateCcw size={14} /> Undo Confirmed Batch
                      </button>
                    )}

                    {/* Multi-Worksheet Export Button Group */}
                    <div style={{ position: 'relative' }}>
                      <a
                        href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=all`}
                        className="btn btn-success btn-sm"
                      >
                        <Layers size={14} /> Export Complete Workbook (.xlsx)
                      </a>
                    </div>
                  </div>
                </div>

                {/* Sub-tab Export Quick Action Bar */}
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                    Export Worksheet Tabs:
                  </span>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=all_results`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    All Results
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=eligible_yes`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Final Yes Only
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=not_eligible_no`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Final No Only
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=calling_list`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Calling List
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=marked_done`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Marked Done
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=not_found`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Not Found
                  </a>
                  <a href={`${API_BASE}/export/daily-workbook/${viewingUploadBatch.id}?tab=manual_overrides`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    Manual Overrides
                  </a>
                </div>

                {/* Selection Options Controls (Stage 1 Draft mode) */}
                {viewingUploadBatch.status === 'draft' && (
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginRight: '0.5rem' }}>
                      Selection Controls:
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBatchSelect('all_eligible')}>
                      <CheckSquare size={14} /> Select All Eligible
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBatchSelect('deselect_all')}>
                      <Square size={14} /> Deselect All
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBatchSelect('final_yes')}>
                      Select Final Result = Yes
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleBatchSelect('not_done')}>
                      Select Not Done Only
                    </button>
                  </div>
                )}

                {/* Item Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter username or name..."
                    style={{ flex: 1, minWidth: '180px' }}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadDailyItems(viewingUploadBatch.id, 1)}
                  />
                  <select
                    className="form-select"
                    value={itemFinalEligibilityFilter}
                    onChange={e => setItemFinalEligibilityFilter(e.target.value)}
                  >
                    <option value="">All Final Results</option>
                    <option value="Yes">Final Result = Yes</option>
                    <option value="No">Final Result = No</option>
                  </select>
                  <select
                    className="form-select"
                    value={itemMasterStatusFilter}
                    onChange={e => setItemMasterStatusFilter(e.target.value)}
                  >
                    <option value="">All Master Statuses</option>
                    <option value="Not Done">Not Done</option>
                    <option value="Already Done">Already Done</option>
                    <option value="Not Found">Not Found</option>
                  </select>
                  <button className="btn btn-secondary btn-sm" onClick={() => loadDailyItems(viewingUploadBatch.id, 1)}>
                    <Filter size={14} /> Search
                  </button>
                </div>

                {/* STAGE 1 REVIEW TABLE */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Select</th>
                        <th>Customer Name</th>
                        <th>Username</th>
                        <th>Automatic Result</th>
                        <th>Manual Override</th>
                        <th>Final Result</th>
                        <th>Master Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No items found in this daily batch.
                          </td>
                        </tr>
                      ) : (
                        uploadItems.map(item => (
                          <tr key={item.id} style={{ opacity: item.is_locked ? 0.85 : 1 }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={!!item.selected}
                                disabled={!!item.is_locked}
                                onChange={e => handleUpdateItem(item.id, { selected: e.target.checked })}
                              />
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.customer_name}</td>
                            <td className="mono-text" style={{ color: 'var(--accent-primary)' }}>{item.raw_username}</td>
                            <td>
                              <span className={`badge ${item.auto_match_result === 'Yes' ? 'badge-yes' : 'badge-no'}`}>
                                {item.auto_match_result}
                              </span>
                            </td>
                            <td>
                              {item.is_locked ? (
                                <span className="mono-text" style={{ fontSize: '0.85rem' }}>{item.manual_override || 'None'}</span>
                              ) : (
                                <select
                                  className="form-select"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                                  value={item.manual_override || 'None'}
                                  onChange={e => handleUpdateItem(item.id, { manualOverride: e.target.value })}
                                >
                                  <option value="None">None</option>
                                  <option value="Yes">Force Yes</option>
                                  <option value="No">Force No</option>
                                </select>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${item.final_eligibility_result === 'Yes' ? 'badge-yes' : 'badge-no'}`}>
                                {item.final_eligibility_result}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                item.master_status === 'Already Done' ? 'badge-yes' :
                                item.master_status === 'Not Found' ? 'badge-no' : 'badge-warning'
                              }`}>
                                {item.master_status}
                              </span>
                            </td>
                            <td>
                              {item.is_locked ? (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.notes || '-'}</span>
                              ) : (
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '100%' }}
                                  placeholder="Add notes..."
                                  value={item.notes || ''}
                                  onChange={e => handleUpdateItem(item.id, { notes: e.target.value })}
                                />
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily History Batches Table */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>All Daily Batches History</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File Name</th>
                    <th>Uploaded By</th>
                    <th>Upload Date</th>
                    <th>Total Rows</th>
                    <th>Confirmed Done</th>
                    <th>Status</th>
                    <th>Exports</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyHistory.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No daily uploads recorded yet.
                      </td>
                    </tr>
                  ) : (
                    dailyHistory.map(u => (
                      <tr key={u.id}>
                        <td className="mono-text">#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.file_name}</td>
                        <td>{u.uploaded_by}</td>
                        <td>{new Date(u.upload_date).toLocaleString()}</td>
                        <td className="mono-text">{u.total_rows}</td>
                        <td className="mono-text" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                          {u.confirmed_count || 0}
                        </td>
                        <td>
                          <span className={`badge ${u.status === 'confirmed' ? 'badge-yes' : 'badge-warning'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`${API_BASE}/export/daily-workbook/${u.id}?tab=all`}
                            className="btn btn-secondary btn-sm"
                            title="Download 9-Worksheet Excel Workbook"
                          >
                            <Layers size={13} /> Complete .xlsx
                          </a>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => loadDailyItems(u.id, 1)}>
                              <Eye size={14} /> Review Items
                            </button>
                            {u.status === 'draft' && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleOpenConfirmModal(u.id)}>
                                Confirm
                              </button>
                            )}
                            {u.status === 'confirmed' && user.role === 'admin' && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleUndoBatch(u.id)}>
                                Undo
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CALLING QUEUE TAB */}
        {activeTab === 'queue' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Calling Campaign Queue</h1>
                <p className="page-subtitle">Prioritized list of eligible customers scheduled for offer outreach</p>
              </div>
            </div>

            <div className="filter-bar">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Search Customer</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.2rem' }}
                    placeholder="Search name, phone, or handle..."
                    value={queueSearch}
                    onChange={e => setQueueSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadQueue(1)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Status</label>
                <select
                  className="form-select"
                  value={queueStatus}
                  onChange={e => setQueueStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Not called">Not called</option>
                  <option value="Call again later">Call again later</option>
                  <option value="No answer">No answer</option>
                  <option value="Interested">Interested</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                <input
                  type="checkbox"
                  id="followUpOnly"
                  checked={queueFollowUpOnly}
                  onChange={e => setQueueFollowUpOnly(e.target.checked)}
                />
                <label htmlFor="followUpOnly" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Follow-ups Due Today</label>
              </div>

              <button className="btn btn-primary" style={{ marginTop: '1.2rem' }} onClick={() => loadQueue(1)}>
                <Filter size={16} /> Filter Queue
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Customer Name</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Attempts</th>
                    <th>Last Contacted By</th>
                    <th>Contact Status</th>
                    <th>Follow-up Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queueItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No queue records available.
                      </td>
                    </tr>
                  ) : (
                    queueItems.map(q => (
                      <tr key={q.id}>
                        <td className="mono-text">{q.record_id}</td>
                        <td style={{ fontWeight: 600 }}>{q.customer_name}</td>
                        <td className="mono-text" style={{ color: 'var(--accent-primary)' }}>{q.username}</td>
                        <td>{q.phone_number || 'N/A'}</td>
                        <td className="mono-text">{q.contact_attempts}</td>
                        <td>{q.contacted_by || 'None'}</td>
                        <td>
                          <span className={`badge ${
                            q.contact_status === 'Accepted offer' ? 'badge-yes' :
                            q.contact_status === 'Declined offer' ? 'badge-no' :
                            q.contact_status === 'Interested' ? 'badge-info' : 'badge-warning'
                          }`}>
                            {q.contact_status}
                          </span>
                        </td>
                        <td>{q.follow_up_date || 'N/A'}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setCallModalCustomer(q);
                              setCallStatus(q.contact_status === 'Not called' ? 'Accepted offer' : q.contact_status);
                              setCallOfferResult('Accepted');
                              setCallNotes(q.notes || '');
                              setCallFollowUpDate(q.follow_up_date || '');
                            }}
                          >
                            <PhoneCall size={14} /> Record Call
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination">
                <div>Showing page {queuePagination.page} of {queuePagination.totalPages} ({queuePagination.total} items)</div>
                <div className="pagination-controls">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={queuePagination.page <= 1}
                    onClick={() => loadQueue(queuePagination.page - 1)}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={queuePagination.page >= queuePagination.totalPages}
                    onClick={() => loadQueue(queuePagination.page + 1)}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPORTS TAB */}
        {activeTab === 'export' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Exports & Reports</h1>
                <p className="page-subtitle">Download multi-worksheet Excel workbooks and system reports</p>
              </div>
            </div>

            <div className="grid-3">
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet className="icon-blue" size={20} /> Master Customer List
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Complete updated master list including auto eligibility, manual overrides, and Done processing status.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`${API_BASE}/export/download?type=master&format=xlsx`} className="btn btn-primary btn-sm">
                    <Download size={14} /> Excel (.xlsx)
                  </a>
                  <a href={`${API_BASE}/export/download?type=master&format=csv`} className="btn btn-secondary btn-sm">
                    <Download size={14} /> CSV (.csv)
                  </a>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers className="icon-cyan" size={20} /> Multi-Worksheet Daily Batch Exporter
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Export latest daily batch into a 9-worksheet Excel workbook preserving original columns, formatting, and statuses.
                </p>
                {dailyHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a
                      href={`${API_BASE}/export/daily-workbook/${dailyHistory[0].id}?tab=all`}
                      className="btn btn-success btn-sm"
                    >
                      <Download size={14} /> Complete 9-Tab Workbook (#{dailyHistory[0].id})
                    </a>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <a href={`${API_BASE}/export/daily-workbook/${dailyHistory[0].id}?tab=eligible_yes`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        Final Yes
                      </a>
                      <a href={`${API_BASE}/export/daily-workbook/${dailyHistory[0].id}?tab=not_eligible_no`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        Final No
                      </a>
                      <a href={`${API_BASE}/export/daily-workbook/${dailyHistory[0].id}?tab=marked_done`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        Marked Done
                      </a>
                      <a href={`${API_BASE}/export/daily-workbook/${dailyHistory[0].id}?tab=not_found`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                        Not Found
                      </a>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No daily batches uploaded yet.</p>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 className="icon-green" size={20} /> Eligible Customers
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Filtered list of all customers who qualify for the offer (auto eligible or manual override).
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`${API_BASE}/export/download?type=eligible&format=xlsx`} className="btn btn-primary btn-sm">
                    <Download size={14} /> Excel (.xlsx)
                  </a>
                  <a href={`${API_BASE}/export/download?type=eligible&format=csv`} className="btn btn-secondary btn-sm">
                    <Download size={14} /> CSV (.csv)
                  </a>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PhoneCall className="icon-purple" size={20} /> Contact & Offer Results
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Full history of employee phone calls, offer acceptance, declination, and agent notes.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`${API_BASE}/export/download?type=results&format=xlsx`} className="btn btn-primary btn-sm">
                    <Download size={14} /> Excel (.xlsx)
                  </a>
                  <a href={`${API_BASE}/export/download?type=results&format=csv`} className="btn btn-secondary btn-sm">
                    <Download size={14} /> CSV (.csv)
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin Management & Audit Logs</h1>
                <p className="page-subtitle">System administration, user access control, audit trails, and backups</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowUserModal(true)}>
                  <Plus size={14} /> Add User
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleCreateBackup}>
                  <Database size={14} /> Backup Database
                </button>
              </div>
            </div>

            {/* Users Table */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>System Users</h3>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td className="mono-text">#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.username}</td>
                      <td>{u.name}</td>
                      <td><span className={`user-badge ${u.role}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.status === 'active' ? 'badge-yes' : 'badge-no'}`}>{u.status}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit Logs */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Audit Trail Logs</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(l => (
                    <tr key={l.id}>
                      <td className="mono-text">#{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.username}</td>
                      <td><span className="badge badge-info">{l.action}</span></td>
                      <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.details}</td>
                      <td className="mono-text">{l.ip_address}</td>
                      <td>{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Customer Detail */}
      {customerDetail && (
        <div className="modal-overlay" onClick={() => setCustomerDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Customer Profile & Activity History</h2>
              <button className="btn-close" onClick={() => setCustomerDetail(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="metric-label">Record ID</div>
                  <div className="mono-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{customerDetail.customer.record_id}</div>
                </div>
                <div>
                  <div className="metric-label">Customer Name</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{customerDetail.customer.customer_name}</div>
                </div>
                <div>
                  <div className="metric-label">Username</div>
                  <div className="mono-text" style={{ color: 'var(--accent-primary)' }}>{customerDetail.customer.username}</div>
                </div>
                <div>
                  <div className="metric-label">Phone</div>
                  <div>{customerDetail.customer.phone_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="metric-label">Processing Status</div>
                  <div>
                    <span className={`badge ${customerDetail.customer.processing_status === 'Done' ? 'badge-yes' : 'badge-warning'}`}>
                      {customerDetail.customer.processing_status === 'Done' ? '✓ Done' : 'Not Done'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="metric-label">Done Date / Processed By</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {customerDetail.customer.done_date ? `${new Date(customerDetail.customer.done_date).toLocaleString()} (${customerDetail.customer.processed_by})` : 'N/A'}
                  </div>
                </div>
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Call History</h4>
              {customerDetail.calls.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>No calls recorded yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customerDetail.calls.map(c => (
                    <li key={c.id} style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.employee_name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(c.call_date).toLocaleString()}</span>
                      </div>
                      <div>Status: <strong>{c.contact_status}</strong> {c.offer_result && `| Result: ${c.offer_result}`}</div>
                      {c.notes && <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>"{c.notes}"</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCustomerDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: STAGE 2 CONFIRMATION MODAL */}
      {confirmSummary && (
        <div className="modal-overlay" onClick={() => setConfirmSummary(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Stage 2 — Confirmation Window</h2>
              <button className="btn-close" onClick={() => setConfirmSummary(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                You are about to confirm daily batch <strong>{confirmSummary.fileName}</strong> (ID #{confirmSummary.uploadId}).
                This will update matched records in the Master List to <strong>Done</strong>.
              </p>

              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Number of selected rows:</span>
                  <strong className="mono-text">{confirmSummary.selectedRows}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Number with Final Result = Yes:</span>
                  <strong className="mono-text" style={{ color: 'var(--accent-success)' }}>{confirmSummary.finalYesCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Number already marked Done:</span>
                  <strong className="mono-text" style={{ color: 'var(--accent-warning)' }}>{confirmSummary.alreadyDoneCount}</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>
                  <span>Master records to be updated:</span>
                  <strong className="mono-text" style={{ color: '#34d399', fontSize: '1.1rem' }}>{confirmSummary.willUpdateCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Records that will be skipped:</span>
                  <strong className="mono-text">{confirmSummary.willSkipCount}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmSummary(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleExecuteConfirm} disabled={confirmingBatch}>
                {confirmingBatch ? 'Updating...' : 'Confirm & Update Master List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Override */}
      {overrideCustomer && (
        <div className="modal-overlay" onClick={() => setOverrideCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Apply Manual Override</h2>
              <button className="btn-close" onClick={() => setOverrideCustomer(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                Modifying eligibility for customer <strong>{overrideCustomer.customer_name}</strong> ({overrideCustomer.username}).
              </p>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Override Value</label>
                <select className="form-select" value={overrideValue} onChange={e => setOverrideValue(e.target.value)}>
                  <option value="Yes">Force Eligible (Yes)</option>
                  <option value="No">Force Ineligible (No)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Override Reason (Required)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why this override is being applied..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOverrideCustomer(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveOverride}>Save Override</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Call */}
      {callModalCustomer && (
        <div className="modal-overlay" onClick={() => setCallModalCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Call Outcome</h2>
              <button className="btn-close" onClick={() => setCallModalCustomer(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                Customer: <strong>{callModalCustomer.customer_name}</strong> ({callModalCustomer.username})
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Contact Status</label>
                <select className="form-select" value={callStatus} onChange={e => setCallStatus(e.target.value)}>
                  <option value="Accepted offer">Accepted offer</option>
                  <option value="Interested">Interested</option>
                  <option value="Call again later">Call again later</option>
                  <option value="No answer">No answer</option>
                  <option value="Declined offer">Declined offer</option>
                  <option value="Wrong number">Wrong number</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Offer Result</label>
                <select className="form-select" value={callOfferResult} onChange={e => setCallOfferResult(e.target.value)}>
                  <option value="Accepted">Accepted</option>
                  <option value="Interested">Interested</option>
                  <option value="Declined">Declined</option>
                  <option value="Not applicable">Not applicable</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={callFollowUpDate}
                  onChange={e => setCallFollowUpDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Call Notes</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="Enter details of conversation..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCallModalCustomer(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRecordCall}>Save Call Outcome</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Daily File Mapping */}
      {previewData && (
        <div className="modal-overlay" onClick={() => setPreviewData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Map Spreadsheet Columns</h2>
              <button className="btn-close" onClick={() => setPreviewData(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                File: <strong>{previewData.originalName}</strong> ({previewData.totalRows} rows detected)
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Username Column (Required)</label>
                <select className="form-select" value={usernameCol} onChange={e => setUsernameCol(e.target.value)}>
                  {previewData.columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Customer Name Column</label>
                <select className="form-select" value={nameCol} onChange={e => setNameCol(e.target.value)}>
                  <option value="">None (Use Username)</option>
                  {previewData.columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Column</label>
                <select className="form-select" value={phoneCol} onChange={e => setPhoneCol(e.target.value)}>
                  <option value="">None</option>
                  {previewData.columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewData(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessDaily} disabled={uploadingDaily}>
                {uploadingDaily ? 'Processing Draft...' : 'Process as Stage 1 Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create User (Admin) */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create System User</h2>
              <button className="btn-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                    <option value="employee">Employee / Caller</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
