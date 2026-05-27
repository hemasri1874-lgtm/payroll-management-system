import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const AttendanceCapture = ({ onAttendanceMarked }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const { user } = useAuth();
    const [status, setStatus] = useState('Ready to scan');
    const [isScanning, setIsScanning] = useState(false);
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

    const captureAndVerify = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsScanning(true);
        setStatus('Scanning...');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setStatus('Failed to capture image');
                setIsScanning(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, 'capture.jpg');

            try {
                const token = localStorage.getItem('token');
                const response = await axios.post('http://localhost:8081/api/v1/attendance/mark', formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setStatus('Success: Attendance Marked!');
                stopCamera();
                if (onAttendanceMarked) onAttendanceMarked();

            } catch (error) {
                console.error(error);
                let errorMsg = 'Error marking attendance.';

                if (error.response) {
                    // Server responded with a status code other than 2xx
                    const status = error.response.status;
                    const data = error.response.data;

                    if (status === 401) {
                        errorMsg = typeof data === 'string' ? data : 'Face verification failed. Try again.';
                    } else if (typeof data === 'string') {
                        errorMsg = `Error (${status}): ${data}`;
                    } else if (data && data.message) {
                        errorMsg = `Error (${status}): ${data.message}`;
                    } else {
                        errorMsg = `Error: Server responded with status ${status}`;
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    errorMsg = 'Error: No response from server. Check backend connection.';
                } else {
                    // Something happened in setting up the request
                    errorMsg = `Error: ${error.message}`;
                }
                setStatus(errorMsg);
            } finally {
                setIsScanning(false);
            }
        }, 'image/jpeg');
    };

    return (
        <div className="card">
            <div className="card-header bg-primary text-white">
                Attendance Capture
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
                        className="btn btn-primary btn-lg me-2"
                        onClick={captureAndVerify}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Verifying...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-person-bounding-box me-2"></i>
                                Verify Face & Mark Attendance
                            </>
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
    );
};

export default AttendanceCapture;
