import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarStyles.css'; // Reusing styles or create new specific ones

const AdminAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAttendance = async (date) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8081/api/v1/attendance/daily?date=${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceList(response.data);
        } catch (err) {
            console.error("Error fetching daily attendance:", err);
            setError("Failed to fetch attendance data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance(selectedDate);
    }, [selectedDate]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    return (
        <div className="attendance-container">
            <h2>Daily Attendance Report</h2>

            <div className="filters" style={{ marginBottom: '20px' }}>
                <label>Select Date: </label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button
                    onClick={() => fetchAttendance(selectedDate)}
                    style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Refresh
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && (
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Employee ID</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Name</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Department</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Time In</th>
                                <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceList.length > 0 ? (
                                attendanceList.map((record) => (
                                    <tr key={record.attendanceId} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}>{record.employeeId}</td>
                                        <td style={{ padding: '12px' }}>{record.employeeName}</td>
                                        <td style={{ padding: '12px' }}>{record.department}</td>
                                        <td style={{ padding: '12px' }}>{new Date(record.time).toLocaleTimeString()}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: record.status === 'PRESENT' ? '#d4edda' : '#fff3cd',
                                                color: record.status === 'PRESENT' ? '#155724' : '#856404'
                                            }}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No attendance records found for this date.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminAttendance;
