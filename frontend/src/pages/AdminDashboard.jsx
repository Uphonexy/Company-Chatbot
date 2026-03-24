import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies, uploadPolicy, deletePolicy } from '../api/chatApi';

const AdminDashboard = () => {
  const [policies, setPolicies] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadPolicies();
  }, [token, navigate]);

  const loadPolicies = async () => {
    try {
      const data = await getPolicies(token);
      setPolicies(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage('');
    setError('');
    
    try {
      const res = await uploadPolicy(file, token);
      setMessage(res.message);
      setFile(null);
      loadPolicies();
    } catch (err) {
       setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await deletePolicy(id, token);
        loadPolicies();
      } catch (err) {
        setError('Failed to delete policy');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Policy Management</h1>
        <button onClick={handleLogout} className="logout-button danger-button">Logout</button>
      </header>
      
      <div className="dashboard-content">
        <div className="upload-section glass-panel">
          <h3>Upload New Policy (.pdf or .docx)</h3>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <div className="upload-controls">
            <input 
              type="file" 
              accept=".pdf,.docx" 
              onChange={handleFileChange} 
              className="file-input"
            />
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="primary-button"
            >
              {uploading ? 'Uploading...' : 'Upload Policy'}
            </button>
          </div>
        </div>

        <div className="policies-list glass-panel">
          <h3>Current Policies</h3>
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id}>
                  <td>{p.filename}</td>
                  <td>{new Date(p.uploaded_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => handleDelete(p.id)} className="danger-button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan="3" style={{textAlign: 'center'}}>No policies uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
