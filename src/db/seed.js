import { v4 as uuid } from 'uuid';

/*
  trackingType determines what fields are shown in the log form:
    'weight_reps'  → weight (kg) × reps          (default for strength)
    'duration'     → duration (min)               (jump rope, plank-like)
    'speed_time'   → speed (km/h) + time (min)    (treadmill, cycling)
    'time_distance'→ time (min) + distance (km)   (rowing, general cardio)
    'time_incline' → time (min) + incline (%)     (stair climber)
*/

export const defaultMuscleGroups = [
  { id: uuid(), name: 'Chest', color: 'var(--color-chest)', icon: '🫁' },
  { id: uuid(), name: 'Back', color: 'var(--color-back)', icon: '🔙' },
  { id: uuid(), name: 'Shoulders', color: 'var(--color-shoulders)', icon: '💪' },
  { id: uuid(), name: 'Arms', color: 'var(--color-arms)', icon: '🦾' },
  { id: uuid(), name: 'Legs', color: 'var(--color-legs)', icon: '🦵' },
  { id: uuid(), name: 'Core', color: 'var(--color-core)', icon: '🎯' },
  { id: uuid(), name: 'Cardio', color: 'var(--color-cardio)', icon: '❤️‍🔥' },
];

export function generateDefaultExercises(muscleGroups) {
  const groupMap = {};
  muscleGroups.forEach(g => { groupMap[g.name] = g.id; });

  return [
    // Chest
    { id: uuid(), name: 'Bench Press', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Incline Dumbbell Press', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Cable Flyes', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Push-Ups', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Dumbbell Flyes', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Chest Dips', muscleGroupId: groupMap['Chest'], isCustom: false, trackingType: 'weight_reps' },
    // Back
    { id: uuid(), name: 'Deadlift', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Pull-Ups', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Barbell Row', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Lat Pulldown', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Seated Cable Row', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'T-Bar Row', muscleGroupId: groupMap['Back'], isCustom: false, trackingType: 'weight_reps' },
    // Shoulders
    { id: uuid(), name: 'Overhead Press', muscleGroupId: groupMap['Shoulders'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Lateral Raises', muscleGroupId: groupMap['Shoulders'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Front Raises', muscleGroupId: groupMap['Shoulders'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Face Pulls', muscleGroupId: groupMap['Shoulders'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Arnold Press', muscleGroupId: groupMap['Shoulders'], isCustom: false, trackingType: 'weight_reps' },
    // Arms
    { id: uuid(), name: 'Barbell Curl', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Tricep Pushdown', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Hammer Curl', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Skull Crushers', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Preacher Curl', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Overhead Tricep Extension', muscleGroupId: groupMap['Arms'], isCustom: false, trackingType: 'weight_reps' },
    // Legs
    { id: uuid(), name: 'Squat', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Leg Press', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Romanian Deadlift', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Leg Curl', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Leg Extension', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Calf Raises', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Bulgarian Split Squat', muscleGroupId: groupMap['Legs'], isCustom: false, trackingType: 'weight_reps' },
    // Core
    { id: uuid(), name: 'Plank', muscleGroupId: groupMap['Core'], isCustom: false, trackingType: 'duration' },
    { id: uuid(), name: 'Hanging Leg Raises', muscleGroupId: groupMap['Core'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Cable Crunch', muscleGroupId: groupMap['Core'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Russian Twists', muscleGroupId: groupMap['Core'], isCustom: false, trackingType: 'weight_reps' },
    { id: uuid(), name: 'Ab Wheel Rollout', muscleGroupId: groupMap['Core'], isCustom: false, trackingType: 'weight_reps' },
    // Cardio – each with appropriate tracking
    { id: uuid(), name: 'Treadmill Run', muscleGroupId: groupMap['Cardio'], isCustom: false, trackingType: 'speed_time_incline' },
    { id: uuid(), name: 'Rowing Machine', muscleGroupId: groupMap['Cardio'], isCustom: false, trackingType: 'time_distance' },
    { id: uuid(), name: 'Cycling', muscleGroupId: groupMap['Cardio'], isCustom: false, trackingType: 'speed_time' },
    { id: uuid(), name: 'Jump Rope', muscleGroupId: groupMap['Cardio'], isCustom: false, trackingType: 'duration' },
    { id: uuid(), name: 'Stair Climber', muscleGroupId: groupMap['Cardio'], isCustom: false, trackingType: 'time_incline' },
  ];
}

/*
  Tracking type field definitions (used by LogWorkout form):
*/
export const TRACKING_FIELDS = {
  weight_reps: {
    label: 'Weight & Reps',
    fields: [
      { key: 'weight', label: 'Weight', unit: 'kg', type: 'number', step: '0.5' },
      { key: 'reps', label: 'Reps', unit: 'reps', type: 'number', step: '1' },
    ],
    summary: (s) => `${s.weight}kg × ${s.reps}`,
    chartValue: (sets) => Math.max(...sets.map(s => s.weight || 0)),
    chartLabel: 'Max Weight (kg)',
  },
  duration: {
    label: 'Duration',
    fields: [
      { key: 'duration', label: 'Duration', unit: 'min', type: 'number', step: '0.5' },
    ],
    summary: (s) => `${s.duration} min`,
    chartValue: (sets) => Math.max(...sets.map(s => s.duration || 0)),
    chartLabel: 'Duration (min)',
  },
  speed_time: {
    label: 'Speed & Time',
    fields: [
      { key: 'speed', label: 'Speed', unit: 'km/h', type: 'number', step: '0.1' },
      { key: 'duration', label: 'Time', unit: 'min', type: 'number', step: '0.5' },
    ],
    summary: (s) => `${s.speed} km/h · ${s.duration} min`,
    chartValue: (sets) => Math.max(...sets.map(s => s.speed || 0)),
    chartLabel: 'Speed (km/h)',
  },
  speed_time_incline: {
    label: 'Speed, Time & Incline',
    fields: [
      { key: 'speed', label: 'Speed', unit: 'km/h', type: 'number', step: '0.1' },
      { key: 'duration', label: 'Time', unit: 'min', type: 'number', step: '0.5' },
      { key: 'incline', label: 'Incline', unit: '%', type: 'number', step: '0.5' },
    ],
    summary: (s) => `${s.speed} km/h · ${s.duration} min · ${s.incline}%`,
    chartValue: (sets) => Math.max(...sets.map(s => s.speed || 0)),
    chartLabel: 'Speed (km/h)',
  },
  time_distance: {
    label: 'Time & Distance',
    fields: [
      { key: 'duration', label: 'Time', unit: 'min', type: 'number', step: '0.5' },
      { key: 'distance', label: 'Distance', unit: 'km', type: 'number', step: '0.01' },
    ],
    summary: (s) => `${s.distance} km · ${s.duration} min`,
    chartValue: (sets) => Math.max(...sets.map(s => s.distance || 0)),
    chartLabel: 'Distance (km)',
  },
  time_incline: {
    label: 'Time & Incline',
    fields: [
      { key: 'duration', label: 'Time', unit: 'min', type: 'number', step: '0.5' },
      { key: 'incline', label: 'Incline', unit: '%', type: 'number', step: '0.5' },
    ],
    summary: (s) => `${s.duration} min · ${s.incline}% incline`,
    chartValue: (sets) => Math.max(...sets.map(s => s.duration || 0)),
    chartLabel: 'Duration (min)',
  },
};

export function getTrackingConfig(trackingType) {
  return TRACKING_FIELDS[trackingType] || TRACKING_FIELDS.weight_reps;
}
