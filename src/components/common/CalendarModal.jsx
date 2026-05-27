import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import '../attendance/CalendarStyles.css'; // Reuse existing styles

const localizer = momentLocalizer(moment);

const CalendarModal = ({ show, onClose }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            fetchHistory();
        }
    }, [show]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/api/attendance/history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Transform data for react-big-calendar
            const calendarEvents = response.data.map(item => {
                const date = new Date(item.date);
                const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                let title = '';
                let statusClass = '';

                if (item.status === 'PRESENT') {
                    title = 'Present';
                    statusClass = 'status-present';
                } else if (item.status === 'LEAVE') {
                    title = item.title || 'Leave'; // Backend sends "Type (Leave)" in title
                    statusClass = 'status-leave';
                }

                return {
                    title: title,
                    start: start,
                    end: end,
                    allDay: true,
                    resource: item, // keep original data
                    className: statusClass
                };
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error("Failed to fetch attendance history", error);
        } finally {
            setLoading(false);
        }
    };

    const eventPropGetter = (event) => {
        return {
            className: event.className
        };
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4" onClick={e => e.stopPropagation()}>
                    <div className="modal-header border-0 pb-0 pt-3 px-4">
                        <h5 className="modal-title fw-bold text-primary">
                            <i className="bi bi-calendar3 me-2"></i>Calendar
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        {loading ? (
                            <div className="d-flex justify-content-center align-items-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 500 }}
                                views={['month']}
                                defaultView='month'
                                toolbar={true}
                                eventPropGetter={eventPropGetter}
                                components={{
                                    event: ({ event }) => (
                                        <span>
                                            {event.resource.status === 'PRESENT' && <i className="bi bi-check-circle-fill me-1"></i>}
                                            {event.resource.status === 'LEAVE' && <i className="bi bi-clock-fill me-1"></i>}
                                            {event.title}
                                        </span>
                                    )
                                }}
                            />
                        )}
                    </div>
                    <div className="modal-footer border-0 justify-content-center pb-4">
                        <div className="d-flex gap-3">
                            <div className="d-flex align-items-center">
                                <div className="d-inline-block rounded me-2" style={{ width: '12px', height: '12px', backgroundColor: '#d1e7dd', border: '1px solid #198754' }}></div>
                                <span className="small text-muted">Present</span>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="d-inline-block rounded me-2" style={{ width: '12px', height: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}></div>
                                <span className="small text-muted">Leave</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Backdrop is handled by the outer div via onClick={onClose} */}
        </div>
    );
};

export default CalendarModal;
