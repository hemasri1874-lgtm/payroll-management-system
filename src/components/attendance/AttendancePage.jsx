import React, { useState } from 'react';
import AttendanceCapture from './AttendanceCapture';
import FaceEnrollment from './FaceEnrollment';
import AttendanceCalendar from './AttendanceCalendar';

const AttendancePage = () => {
    const [activeMode, setActiveMode] = useState(null); // null, 'mark', 'enroll'

    if (!activeMode) {
        return (
            <div className="container-fluid p-4">
                <h2 className="mb-4">Attendance Management</h2>
                <div className="row g-4 justify-content-center mt-2">
                    <div className="col-md-5 col-lg-4">
                        <div
                            className="card h-100 shadow-sm text-center p-4 border-0"
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => setActiveMode('mark')}
                        >
                            <div className="card-body">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-4 d-inline-flex mb-4 align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                    <i className="bi bi-camera-video text-primary fs-1"></i>
                                </div>
                                <h3 className="card-title h4 mb-3">Mark Attendance</h3>
                                <p className="card-text text-muted mb-4">
                                    Use facial recognition to mark your daily attendance securely.
                                </p>
                                <button className="btn btn-primary px-4 rounded-pill">
                                    Start Camera
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-5 col-lg-4">
                        <div
                            className="card h-100 shadow-sm text-center p-4 border-0"
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => setActiveMode('enroll')}
                        >
                            <div className="card-body">
                                <div className="rounded-circle bg-success bg-opacity-10 p-4 d-inline-flex mb-4 align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                    <i className="bi bi-person-bounding-box text-success fs-1"></i>
                                </div>
                                <h3 className="card-title h4 mb-3">Face Enrollment</h3>
                                <p className="card-text text-muted mb-4">
                                    Register or update your face data for recognition system.
                                </p>
                                <button className="btn btn-outline-success px-4 rounded-pill">
                                    Register Face
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mt-5">
                    <div className="col-12">
                        <AttendanceCalendar />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="mb-0">
                    {activeMode === 'mark' ? 'Mark Attendance' : 'Face Enrollment'}
                </h2>
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => setActiveMode(null)}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Options
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-center">
                        <div style={{ maxWidth: '700px', width: '100%' }}>
                            {activeMode === 'mark' && (
                                <AttendanceCapture
                                    onAttendanceMarked={() => {
                                        // Optional: add a delay or confirmation before going back
                                        // setActiveMode(null); 
                                    }}
                                />
                            )}
                            {activeMode === 'enroll' && (
                                <FaceEnrollment
                                    onEnrollmentComplete={() => setActiveMode(null)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
