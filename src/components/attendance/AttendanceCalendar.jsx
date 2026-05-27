import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import './CalendarStyles.css';

// Setup the localizer by providing the moment (or globalize) instance.
const localizer = momentLocalizer(moment);

const AttendanceCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/api/v1/attendance/history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Transform data for react-big-calendar
            const calendarEvents = response.data.map(item => {
                const date = new Date(item.date);
                // Adjust for timezone if necessary, or ensure backend sends ISO string
                // Set start and end to the same day
                const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                let title = '';
                let statusClass = '';

                if (item.status === 'PRESENT') {
                    title = 'Present';
                    statusClass = 'status-present';
                } else if (item.status === 'LEAVE') {
                    title = item.title || 'Leave'; // Backend sends "Type (Leave)"
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
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch attendance history", error);
            setLoading(false);
        }
    };

    const eventPropGetter = (event) => {
        return {
            className: event.className
        };
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );



    return (
        <div className="mt-4">
            <div className="bg-white p-3 rounded-4 shadow-sm">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    views={['month', 'agenda']}
                    defaultView='month'
                    date={date}
                    onNavigate={handleNavigate}
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
            </div>

            <div className="d-flex gap-3 mt-3 justify-content-center">
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
    );
};

export default AttendanceCalendar;
