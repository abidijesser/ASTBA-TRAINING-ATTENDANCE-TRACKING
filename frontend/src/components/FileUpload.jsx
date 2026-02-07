import { useState } from 'react';
import { uploadFile, deleteFile } from '../services/uploadService';

/**
 * File Upload Component
 * Handles file selection, upload to Cloudinary, and deletion
 */
const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState('');

    /**
     * Handle file selection
     */
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError('');

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    /**
     * Handle file upload
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const result = await uploadFile(selectedFile);

            setUploadedFile(result.data);
            setSelectedFile(null);
            setPreview('');

        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handle file deletion
     */
    const handleDelete = async () => {
        if (!uploadedFile) return;

        try {
            await deleteFile(uploadedFile.publicId);
            setUploadedFile(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div style={{
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <h3 style={{ marginTop: 0 }}>File Upload Demo</h3>

            {/* File Input */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'block', marginBottom: '0.5rem' }}
                />
                {preview && (
                    <img
                        src={preview}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            marginTop: '1rem',
                            borderRadius: '4px'
                        }}
                    />
                )}
            </div>

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: selectedFile && !uploading ? '#3498db' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                }}
            >
                {uploading ? 'Uploading...' : 'Upload File'}
            </button>

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#ffe0e0',
                    color: '#c00',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* Uploaded File Info */}
            {uploadedFile && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#e0f7e0',
                    borderRadius: '4px',
                    marginTop: '1rem'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Upload Successful!</h4>
                    <img
                        src={uploadedFile.url}
                        alt="Uploaded"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '4px',
                            marginBottom: '1rem'
                        }}
                    />
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        <p><strong>URL:</strong> <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">{uploadedFile.url}</a></p>
                        <p><strong>Public ID:</strong> {uploadedFile.publicId}</p>
                        <p><strong>Format:</strong> {uploadedFile.format}</p>
                        {uploadedFile.dimensions && (
                            <p><strong>Dimensions:</strong> {uploadedFile.dimensions.width} × {uploadedFile.dimensions.height}</p>
                        )}
                    </div>
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        Delete File
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
