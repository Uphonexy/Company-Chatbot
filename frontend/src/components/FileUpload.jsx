import React, { useState } from 'react';
import { uploadPolicy } from '../api/chatApi';

const FileUpload = ({ token, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage('');
        setError('');
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
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
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
    );
};

export default FileUpload;
