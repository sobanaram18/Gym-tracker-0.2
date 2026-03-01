import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { initializeData } from './db/storage';
import NavBar from './components/NavBar';
import FloatingTimer from './components/FloatingTimer';
import Home from './pages/Home';
import TodayWorkout from './pages/TodayWorkout';
import LogWorkout from './pages/LogWorkout';
import MuscleGroups from './pages/MuscleGroups';
import GroupDetail from './pages/GroupDetail';
import ExerciseHistory from './pages/ExerciseHistory';
import Schedule from './pages/Schedule';

export default function App() {
  useEffect(() => {
    initializeData();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/today" element={<TodayWorkout />} />
        <Route path="/workout/:exerciseId" element={<LogWorkout />} />
        <Route path="/muscle-groups" element={<MuscleGroups />} />
        <Route path="/muscle-groups/:groupId" element={<GroupDetail />} />
        <Route path="/exercise/:exerciseId/history" element={<ExerciseHistory />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
      <FloatingTimer />
      <NavBar />
    </>
  );
}
