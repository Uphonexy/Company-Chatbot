import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies, uploadPolicy, deletePolicy } from '../api/chatApi';
import FileUpload from '../components/FileUpload';

const AdminDashboard = () => {
  const [policies, setPolicies] = useState([]);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await deletePolicy(id, token);
        loadPolicies();
      } catch (err) {
        setDeleteError('Failed to delete policy');
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
        <FileUpload token={token} onUploadSuccess={loadPolicies} />

        <div className="policies-list glass-panel">
          <h3>Current Policies</h3>
          {deleteError && <div className="error-message">{deleteError}</div>}
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
                  <td colSpan="3" style={{ textAlign: 'center' }}>No policies uploaded yet.</td>
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
