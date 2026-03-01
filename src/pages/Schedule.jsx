import { useState, useCallback, useMemo } from 'react';
import {
    getSchedules,
    getExercises,
    getMuscleGroups,
    getMuscleGroupById,
    getExerciseById,
    setScheduleForDay,
    getExerciseIdsForDate,
    addScheduleEntry,
    removeScheduleEntry,
    getDayName,
    getDayShort,
    formatDate,
} from '../db/storage';
import { v4 as uuid } from 'uuid';
import './Schedule.css';

export default function Schedule() {
    const [selectedDay, setSelectedDay] = useState(null); // dayOfWeek index for week view
    const [selectedDate, setSelectedDate] = useState(null); // ISO string for month view
    const [refreshKey, setRefreshKey] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
    const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

    const schedules = getSchedules();
    const exercises = getExercises();
    const muscleGroups = getMuscleGroups();

    // Build week schedule map
    const daySchedule = {};
    for (let i = 0; i < 7; i++) {
        daySchedule[i] = [];
    }
    schedules.forEach(s => {
        if (s.dayOfWeek !== null && !s.date && (s.recurrence === 'weekly' || !s.recurrence)) {
            daySchedule[s.dayOfWeek] = s.exerciseIds;
        }
    });

    const today = new Date();
    const todayDay = today.getDay();

    // Month calendar data
    const monthData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + monthOffset;
        const d = new Date(year, month, 1);
        const actualMonth = d.getMonth();
        const actualYear = d.getFullYear();
        const firstDayOfWeek = d.getDay();
        const daysInMonth = new Date(actualYear, actualMonth + 1, 0).getDate();
        const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const cells = [];
        // Pad leading empty cells
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells.push({ day: null, iso: null });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const iso = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const exerciseIds = getExerciseIdsForDate(iso);
            const isToday = iso === today.toISOString().split('T')[0];
            cells.push({ day, iso, exerciseIds, isToday });
        }

        return { monthName, cells, actualMonth, actualYear };
    }, [monthOffset, refreshKey]);

    // Custom schedules (every_n_days, monthly, biweekly)
    const customSchedules = schedules.filter(s =>
        s.recurrence === 'every_n_days' || s.recurrence === 'monthly' || s.recurrence === 'biweekly'
    );

    const handleRefresh = useCallback(() => {
        setRefreshKey(k => k + 1);
        setSelectedDay(null);
        setSelectedDate(null);
    }, []);

    return (
        <div className="page schedule-page" key={refreshKey}>
            <div className="schedule-top-row">
                <div>
                    <h1 className="page-title">Schedule</h1>
                    <p className="page-subtitle">Plan your workout routine</p>
                </div>
                <button
                    className={`btn btn-sm ${showCalendar ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowCalendar(c => !c)}
                    id="toggle-calendar-btn"
                >
                    📅 {showCalendar ? 'Hide' : 'Google'} Cal
                </button>
            </div>

            {/* Google Calendar Embed */}
            {showCalendar && (
                <div className="glass-card gcal-container" id="google-calendar-embed">
                    <div className="gcal-header">
                        <h3 className="gcal-title">📅 Google Calendar</h3>
                    </div>
                    <div className="gcal-iframe-wrap">
                        <iframe
                            src="https://calendar.google.com/calendar/embed?mode=WEEK&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&height=400&wkst=1&bgcolor=%230f0f13&color=%237c6aff"
                            style={{ border: 0, width: '100%', height: '320px', borderRadius: '12px' }}
                            frameBorder="0"
                            scrolling="no"
                            title="Google Calendar"
                        />
                    </div>
                    <p className="gcal-note">
                        💡 Sign in to Google in this browser to see your events.{' '}
                        <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="gcal-link">
                            Open Google Calendar ↗
                        </a>
                    </p>
                </div>
            )}

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
                <button
                    className={`view-mode-btn ${viewMode === 'week' ? 'view-mode-btn--active' : ''}`}
                    onClick={() => setViewMode('week')}
                >
                    Week
                </button>
                <button
                    className={`view-mode-btn ${viewMode === 'month' ? 'view-mode-btn--active' : ''}`}
                    onClick={() => setViewMode('month')}
                >
                    Month
                </button>
            </div>

            {/* ── WEEK VIEW ── */}
            {viewMode === 'week' && (
                <>
                    <div className="schedule-week">
                        {[0, 1, 2, 3, 4, 5, 6].map(day => {
                            const exerciseIds = daySchedule[day] || [];
                            const isToday = day === todayDay;
                            return (
                                <div
                                    key={day}
                                    className={`glass-card clickable schedule-day ${isToday ? 'schedule-day--today' : ''} ${selectedDay === day ? 'schedule-day--selected' : ''}`}
                                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                                    id={`schedule-day-${day}`}
                                >
                                    <span className="schedule-day-label">{getDayShort(day)}</span>
                                    <span className="schedule-day-count">
                                        {exerciseIds.length > 0 ? exerciseIds.length : '–'}
                                    </span>
                                    {isToday && <div className="schedule-day-dot" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day Editor */}
                    {selectedDay !== null && (
                        <DayEditor
                            day={selectedDay}
                            currentIds={daySchedule[selectedDay] || []}
                            exercises={exercises}
                            muscleGroups={muscleGroups}
                            onSave={handleRefresh}
                            key={`day-${selectedDay}-${refreshKey}`}
                        />
                    )}

                    {/* Week Recap */}
                    {selectedDay === null && (
                        <div className="schedule-recap">
                            {[0, 1, 2, 3, 4, 5, 6].map(day => {
                                const exerciseIds = daySchedule[day] || [];
                                if (exerciseIds.length === 0) return null;
                                return (
                                    <div key={day} className="glass-card schedule-recap-card" onClick={() => setSelectedDay(day)}>
                                        <div className="schedule-recap-day">{getDayName(day)}</div>
                                        <div className="schedule-recap-exercises">
                                            {exerciseIds.map(id => {
                                                const ex = getExerciseById(id);
                                                if (!ex) return null;
                                                const grp = getMuscleGroupById(ex.muscleGroupId);
                                                return (
                                                    <span key={id} className="schedule-recap-tag" style={{ '--tag-color': grp?.color || 'var(--accent-purple)' }}>
                                                        {ex.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── MONTH VIEW ── */}
            {viewMode === 'month' && (
                <>
                    <div className="month-nav">
                        <button className="btn btn-sm btn-secondary" onClick={() => setMonthOffset(m => m - 1)}>‹ Prev</button>
                        <h2 className="month-title">{monthData.monthName}</h2>
                        <button className="btn btn-sm btn-secondary" onClick={() => setMonthOffset(m => m + 1)}>Next ›</button>
                    </div>

                    <div className="month-grid">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="month-header-cell">{d}</div>
                        ))}

                        {/* Calendar cells */}
                        {monthData.cells.map((cell, i) => (
                            <div
                                key={i}
                                className={`month-cell ${cell.day ? 'month-cell--active' : ''} ${cell.isToday ? 'month-cell--today' : ''} ${selectedDate === cell.iso ? 'month-cell--selected' : ''}`}
                                onClick={() => cell.iso && setSelectedDate(cell.iso === selectedDate ? null : cell.iso)}
                            >
                                {cell.day && (
                                    <>
                                        <span className="month-cell-day">{cell.day}</span>
                                        {cell.exerciseIds && cell.exerciseIds.length > 0 && (
                                            <div className="month-cell-dots">
                                                {cell.exerciseIds.slice(0, 3).map((_, j) => (
                                                    <span key={j} className="month-cell-dot" />
                                                ))}
                                                {cell.exerciseIds.length > 3 && <span className="month-cell-more">+{cell.exerciseIds.length - 3}</span>}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Selected date detail */}
                    {selectedDate && (
                        <div className="month-date-detail">
                            <h3 className="section-title">{formatDate(selectedDate)}</h3>
                            {(() => {
                                const ids = getExerciseIdsForDate(selectedDate);
                                if (ids.length === 0) return <p className="month-detail-empty">No exercises scheduled</p>;
                                return (
                                    <div className="month-detail-exercises">
                                        {ids.map(id => {
                                            const ex = getExerciseById(id);
                                            if (!ex) return null;
                                            const grp = getMuscleGroupById(ex.muscleGroupId);
                                            return (
                                                <div key={id} className="month-detail-ex">
                                                    <div className="month-detail-indicator" style={{ background: grp?.color || 'var(--accent-purple)' }} />
                                                    <span className="month-detail-name">{ex.name}</span>
                                                    <span className="month-detail-group">{grp?.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}

            {/* ── Custom Recurring Schedules ── */}
            <div className="divider" />
            <CustomScheduleManager
                exercises={exercises}
                muscleGroups={muscleGroups}
                customSchedules={customSchedules}
                onRefresh={handleRefresh}
            />
        </div>
    );
}

/* ── Day Editor (Week View) ── */
function DayEditor({ day, currentIds, exercises, muscleGroups, onSave }) {
    const [selectedIds, setSelectedIds] = useState(new Set(currentIds));
    const [filterGroup, setFilterGroup] = useState('all');
    const [recurrence, setRecurrence] = useState('weekly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const toggleExercise = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleSave = useCallback(() => {
        setScheduleForDay(day, Array.from(selectedIds), recurrence, { startDate });
        onSave();
    }, [day, selectedIds, recurrence, startDate, onSave]);

    const filteredExercises = filterGroup === 'all'
        ? exercises
        : exercises.filter(e => e.muscleGroupId === filterGroup);

    return (
        <div className="day-editor" id="day-editor">
            <div className="day-editor-header">
                <h2 className="section-title">{getDayName(day)}</h2>
                <span className="badge badge-purple">{selectedIds.size} selected</span>
            </div>

            {/* Recurrence selector */}
            <div className="recurrence-row">
                <span className="input-label" style={{ margin: 0 }}>Repeat</span>
                <select
                    className="input-field recurrence-select"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                >
                    <option value="weekly">Every week</option>
                    <option value="biweekly">Every 2 weeks</option>
                </select>
            </div>

            {recurrence === 'biweekly' && (
                <div className="recurrence-row">
                    <span className="input-label" style={{ margin: 0 }}>Starting from</span>
                    <input
                        type="date"
                        className="input-field recurrence-select"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        id="biweekly-start-date"
                    />
                </div>
            )}

            {/* Filter */}
            <div className="day-editor-filter">
                <button
                    className={`btn btn-sm ${filterGroup === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterGroup('all')}
                >
                    All
                </button>
                {muscleGroups.map(g => (
                    <button
                        key={g.id}
                        className={`btn btn-sm ${filterGroup === g.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterGroup(filterGroup === g.id ? 'all' : g.id)}
                    >
                        {g.icon} {g.name}
                    </button>
                ))}
            </div>

            {/* Exercise list */}
            <div className="day-editor-list">
                {filteredExercises.map(ex => {
                    const isSelected = selectedIds.has(ex.id);
                    const group = getMuscleGroupById(ex.muscleGroupId);
                    return (
                        <div
                            key={ex.id}
                            className={`day-editor-item ${isSelected ? 'day-editor-item--selected' : ''}`}
                            onClick={() => toggleExercise(ex.id)}
                        >
                            <div className="day-editor-item-check">{isSelected ? '✓' : ''}</div>
                            <div className="day-editor-item-info">
                                <span className="day-editor-item-name">{ex.name}</span>
                                <span className="day-editor-item-group" style={{ color: group?.color }}>{group?.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSave} id="save-schedule-btn">
                Save {getDayName(day)} Schedule
            </button>
        </div>
    );
}

/* ── Custom Schedule Manager (every N days, monthly) ── */
function CustomScheduleManager({ exercises, muscleGroups, customSchedules, onRefresh }) {
    const [showForm, setShowForm] = useState(false);
    const [recType, setRecType] = useState('every_n_days');
    const [intervalDays, setIntervalDays] = useState('3');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedExIds, setSelectedExIds] = useState(new Set());
    const [filterGroup, setFilterGroup] = useState('all');

    const toggleExercise = useCallback((id) => {
        setSelectedExIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleSave = useCallback(() => {
        if (selectedExIds.size === 0) return;

        const entry = {
            exerciseIds: Array.from(selectedExIds),
            recurrence: recType,
            dayOfWeek: null,
            date: null,
            startDate: startDate,
            intervalDays: recType === 'every_n_days' ? parseInt(intervalDays, 10) : null,
            dayOfMonth: recType === 'monthly' ? parseInt(dayOfMonth, 10) : null,
        };

        addScheduleEntry(entry);
        setShowForm(false);
        setSelectedExIds(new Set());
        setStartDate(new Date().toISOString().split('T')[0]);
        onRefresh();
    }, [recType, intervalDays, dayOfMonth, startDate, selectedExIds, onRefresh]);

    const handleDelete = useCallback((id) => {
        removeScheduleEntry(id);
        onRefresh();
    }, [onRefresh]);

    const filteredExercises = filterGroup === 'all'
        ? exercises
        : exercises.filter(e => e.muscleGroupId === filterGroup);

    const getRecurrenceLabel = (s) => {
        const startLabel = s.startDate ? ` · from ${formatDate(s.startDate)}` : '';
        if (s.recurrence === 'every_n_days') return `Every ${s.intervalDays} days${startLabel}`;
        if (s.recurrence === 'monthly') return `Monthly on day ${s.dayOfMonth}`;
        if (s.recurrence === 'biweekly') return `Biweekly on ${getDayName(s.dayOfWeek)}`;
        return s.recurrence;
    };

    return (
        <div className="custom-schedule-section">
            <div className="section-header">
                <h2 className="section-title">Custom Schedules</h2>
                {!showForm && (
                    <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)} id="add-custom-schedule-btn">
                        + New
                    </button>
                )}
            </div>

            {/* Existing custom schedules */}
            {customSchedules.length > 0 && (
                <div className="custom-schedule-list">
                    {customSchedules.map(s => (
                        <div key={s.id} className="glass-card custom-schedule-card">
                            <div className="custom-schedule-info">
                                <span className="custom-schedule-freq">{getRecurrenceLabel(s)}</span>
                                <div className="custom-schedule-exercises">
                                    {s.exerciseIds.map(eid => {
                                        const ex = getExerciseById(eid);
                                        return ex ? <span key={eid} className="schedule-recap-tag">{ex.name}</span> : null;
                                    })}
                                </div>
                            </div>
                            <button
                                className="btn-icon custom-schedule-delete"
                                onClick={() => handleDelete(s.id)}
                                title="Delete"
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {customSchedules.length === 0 && !showForm && (
                <p className="custom-schedule-empty">
                    Create custom recurring schedules like "every 3 days" or "monthly".
                </p>
            )}

            {/* New Custom Schedule Form */}
            {showForm && (
                <div className="glass-card custom-schedule-form">
                    <h3 className="custom-form-title">New Custom Schedule</h3>

                    {/* Recurrence type */}
                    <label className="input-label">Frequency</label>
                    <select
                        className="input-field"
                        value={recType}
                        onChange={(e) => setRecType(e.target.value)}
                    >
                        <option value="every_n_days">Every N days</option>
                        <option value="monthly">Monthly on a day</option>
                    </select>

                    {/* Interval */}
                    {recType === 'every_n_days' && (
                        <div className="custom-form-interval">
                            <label className="input-label">Repeat every</label>
                            <div className="custom-form-interval-row">
                                <input
                                    type="number"
                                    className="input-field custom-form-num-input"
                                    value={intervalDays}
                                    onChange={(e) => setIntervalDays(e.target.value)}
                                    min="1"
                                    max="90"
                                />
                                <span className="custom-form-interval-label">days</span>
                            </div>
                        </div>
                    )}

                    {recType === 'monthly' && (
                        <div className="custom-form-interval">
                            <label className="input-label">Day of month</label>
                            <input
                                type="number"
                                className="input-field custom-form-num-input"
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(e.target.value)}
                                min="1"
                                max="31"
                            />
                        </div>
                    )}

                    {/* Start date */}
                    <div className="custom-form-interval">
                        <label className="input-label">Start date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            id="custom-start-date"
                        />
                    </div>

                    {/* Exercise picker */}
                    <label className="input-label" style={{ marginTop: '12px' }}>Exercises ({selectedExIds.size} selected)</label>

                    <div className="day-editor-filter">
                        <button
                            className={`btn btn-sm ${filterGroup === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterGroup('all')}
                        >All</button>
                        {muscleGroups.map(g => (
                            <button
                                key={g.id}
                                className={`btn btn-sm ${filterGroup === g.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilterGroup(filterGroup === g.id ? 'all' : g.id)}
                            >{g.icon} {g.name}</button>
                        ))}
                    </div>

                    <div className="day-editor-list" style={{ maxHeight: '200px' }}>
                        {filteredExercises.map(ex => {
                            const isSelected = selectedExIds.has(ex.id);
                            const group = getMuscleGroupById(ex.muscleGroupId);
                            return (
                                <div
                                    key={ex.id}
                                    className={`day-editor-item ${isSelected ? 'day-editor-item--selected' : ''}`}
                                    onClick={() => toggleExercise(ex.id)}
                                >
                                    <div className="day-editor-item-check">{isSelected ? '✓' : ''}</div>
                                    <div className="day-editor-item-info">
                                        <span className="day-editor-item-name">{ex.name}</span>
                                        <span className="day-editor-item-group" style={{ color: group?.color }}>{group?.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="custom-form-actions">
                        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} id="save-custom-schedule">Create Schedule</button>
                    </div>
                </div>
            )}
        </div>
    );
}
