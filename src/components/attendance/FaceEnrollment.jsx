import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FaceEnrollment = ({ onEnrollmentComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Ready to enroll');
    const [isProcessing, setIsProcessing] = useState(false);
    const streamRef = useRef(null);

    useEffect(() => {
        startVideo();
        return () => {
            stopCamera();
        };
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error(err);
                setStatus('Error accessing camera');
            });
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const captureAndEnroll = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        setStatus('Processing...');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setStatus('Failed to capture image');
                setIsProcessing(false);
                return;
            }

            try {
                const token = localStorage.getItem('token');

                // 1. Get Employee ID
                const employeeResponse = await axios.get(`http://localhost:8081/api/v1/employees/user/${user.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const employeeId = employeeResponse.data.employeeId;

                // 2. Upload Face
                const formData = new FormData();
                formData.append('file', blob, 'enrollment.jpg');

                await axios.post(`http://localhost:8081/api/v1/employees/${employeeId}/face-enrollment`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setStatus('Success! Face Enrolled.');
                stopCamera();

                setTimeout(() => {
                    if (onEnrollmentComplete) {
                        onEnrollmentComplete();
                    } else {
                        navigate('/employee-dashboard');
                    }
                }, 2000);

            } catch (error) {
                console.error(error);
                if (error.response && error.response.data) {
                    setStatus(`Error: ${error.response.data}`);
                } else {
                    setStatus('Error enrolling face. Please try again.');
                }
            } finally {
                setIsProcessing(false);
            }
        }, 'image/jpeg');
    };

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span>Face Enrollment</span>
                    {onEnrollmentComplete && (
                        <button className="btn btn-sm btn-outline-secondary" onClick={onEnrollmentComplete}>
                            Back to Dashboard
                        </button>
                    )}
                </div>
                <div className="card-body text-center">
                    <h3>{status}</h3>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            height="480"
                            width="640"
                            style={{ borderRadius: '8px', maxWidth: '100%' }}
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                    <div className="mt-3">
                        <button
                            className="btn btn-primary btn-lg me-3"
                            onClick={captureAndEnroll}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Processing...
                                </>
                            ) : (
                                'Capture & Enroll'
                            )}
                        </button>
                        <button
                            className="btn btn-outline-danger btn-lg"
                            onClick={() => {
                                stopCamera();
                                setStatus('Camera stopped.');
                            }}
                        >
                            <i className="bi bi-camera-video-off me-2"></i>
                            Close Camera
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceEnrollment;
