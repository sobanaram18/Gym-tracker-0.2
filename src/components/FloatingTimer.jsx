import { useState, useEffect, useRef, useCallback } from 'react';
import './FloatingTimer.css';

const PRESETS = [
    { label: '30s', seconds: 30 },
    { label: '1:00', seconds: 60 },
    { label: '1:30', seconds: 90 },
    { label: '2:00', seconds: 120 },
    { label: '3:00', seconds: 180 },
    { label: '5:00', seconds: 300 },
];

export default function FloatingTimer() {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('rest'); // 'rest' | 'stopwatch'
    const [totalSeconds, setTotalSeconds] = useState(90);
    const [remaining, setRemaining] = useState(90);
    const [isRunning, setIsRunning] = useState(false);
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [customMin, setCustomMin] = useState('');
    const [customSec, setCustomSec] = useState('');
    const intervalRef = useRef(null);
    const audioRef = useRef(null);

    // Rest timer countdown
    useEffect(() => {
        if (mode === 'rest' && isRunning && remaining > 0) {
            intervalRef.current = setInterval(() => {
                setRemaining(r => {
                    if (r <= 1) {
                        setIsRunning(false);
                        // Play alarm sound
                        playAlarm();
                        return 0;
                    }
                    return r - 1;
                });
            }, 1000);
        } else if (mode === 'stopwatch' && isRunning) {
            intervalRef.current = setInterval(() => {
                setStopwatchTime(t => t + 1);
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, remaining, mode]);

    const playAlarm = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Play 3 beeps
            [0, 0.25, 0.5].forEach(delay => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                osc.type = 'sine';
                gain.gain.value = 0.3;
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.15);
            });
        } catch {
            // Audio not available
        }
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handlePreset = useCallback((seconds) => {
        setTotalSeconds(seconds);
        setRemaining(seconds);
        setIsRunning(false);
    }, []);

    const handleCustomSet = useCallback(() => {
        const mins = parseInt(customMin || '0', 10);
        const secs = parseInt(customSec || '0', 10);
        const total = mins * 60 + secs;
        if (total > 0) {
            setTotalSeconds(total);
            setRemaining(total);
            setIsRunning(false);
            setCustomMin('');
            setCustomSec('');
        }
    }, [customMin, customSec]);

    const handleStart = useCallback(() => {
        if (mode === 'rest' && remaining === 0) {
            setRemaining(totalSeconds);
        }
        setIsRunning(true);
    }, [mode, remaining, totalSeconds]);

    const handlePause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        if (mode === 'rest') {
            setRemaining(totalSeconds);
        } else {
            setStopwatchTime(0);
        }
    }, [mode, totalSeconds]);

    // Calculate progress for circular indicator
    const progress = mode === 'rest'
        ? totalSeconds > 0 ? (remaining / totalSeconds) : 0
        : 0;

    const displayTime = mode === 'rest' ? remaining : stopwatchTime;
    const isFinished = mode === 'rest' && remaining === 0 && totalSeconds > 0;

    return (
        <>
            {/* Floating Button */}
            <button
                className={`fab-timer ${isRunning ? 'fab-timer--active' : ''} ${isFinished ? 'fab-timer--done' : ''}`}
                onClick={() => setIsOpen(o => !o)}
                id="floating-timer-btn"
            >
                {isRunning ? (
                    <span className="fab-timer-time">{formatTime(displayTime)}</span>
                ) : (
                    <span className="fab-timer-icon">⏱</span>
                )}
                {isRunning && (
                    <svg className="fab-timer-ring" viewBox="0 0 44 44">
                        <circle
                            cx="22" cy="22" r="20"
                            fill="none"
                            stroke="rgba(124, 106, 255, 0.2)"
                            strokeWidth="2.5"
                        />
                        <circle
                            cx="22" cy="22" r="20"
                            fill="none"
                            stroke="var(--accent-purple)"
                            strokeWidth="2.5"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
                            strokeLinecap="round"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                    </svg>
                )}
            </button>

            {/* Timer Panel */}
            {isOpen && (
                <div className="timer-panel-overlay" onClick={() => setIsOpen(false)}>
                    <div className="timer-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="timer-panel-header">
                            <h3 className="timer-panel-title">⏱ Timer</h3>
                            <button className="btn-icon" onClick={() => setIsOpen(false)}>✕</button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="timer-mode-toggle">
                            <button
                                className={`timer-mode-btn ${mode === 'rest' ? 'timer-mode-btn--active' : ''}`}
                                onClick={() => { setMode('rest'); setIsRunning(false); }}
                            >
                                Rest Timer
                            </button>
                            <button
                                className={`timer-mode-btn ${mode === 'stopwatch' ? 'timer-mode-btn--active' : ''}`}
                                onClick={() => { setMode('stopwatch'); setIsRunning(false); }}
                            >
                                Stopwatch
                            </button>
                        </div>

                        {/* Timer Display */}
                        <div className={`timer-display ${isFinished ? 'timer-display--done' : ''}`}>
                            <span className="timer-display-time">{formatTime(displayTime)}</span>
                            {mode === 'rest' && (
                                <span className="timer-display-total">of {formatTime(totalSeconds)}</span>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="timer-controls">
                            {!isRunning ? (
                                <button className="btn btn-primary timer-ctrl-btn" onClick={handleStart} id="timer-start-btn">
                                    ▶ Start
                                </button>
                            ) : (
                                <button className="btn btn-secondary timer-ctrl-btn" onClick={handlePause} id="timer-pause-btn">
                                    ⏸ Pause
                                </button>
                            )}
                            <button className="btn btn-secondary timer-ctrl-btn" onClick={handleReset} id="timer-reset-btn">
                                ↺ Reset
                            </button>
                        </div>

                        {/* Rest Timer Presets */}
                        {mode === 'rest' && (
                            <>
                                <div className="timer-section-label">Quick Presets</div>
                                <div className="timer-presets">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p.seconds}
                                            className={`btn btn-sm ${totalSeconds === p.seconds ? 'btn-primary' : 'btn-secondary'} timer-preset-btn`}
                                            onClick={() => handlePreset(p.seconds)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="timer-section-label">Custom Duration</div>
                                <div className="timer-custom">
                                    <div className="timer-custom-inputs">
                                        <input
                                            type="number"
                                            className="input-field timer-custom-input"
                                            placeholder="0"
                                            value={customMin}
                                            onChange={(e) => setCustomMin(e.target.value)}
                                            min="0"
                                            max="99"
                                            id="timer-custom-min"
                                        />
                                        <span className="timer-custom-label">min</span>
                                        <input
                                            type="number"
                                            className="input-field timer-custom-input"
                                            placeholder="0"
                                            value={customSec}
                                            onChange={(e) => setCustomSec(e.target.value)}
                                            min="0"
                                            max="59"
                                            id="timer-custom-sec"
                                        />
                                        <span className="timer-custom-label">sec</span>
                                    </div>
                                    <button className="btn btn-sm btn-primary" onClick={handleCustomSet} id="timer-custom-set">
                                        Set
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
