import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getLearningProgressByUserId } from "../api/learningProgressApi";
import { useAuth } from "../context/auth/useAuth";

const ProgressDashboard = () => {
  const [progressData, setProgressData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!currentUser?.id) {
          throw new Error('User not authenticated');
        }
        const response = await getLearningProgressByUserId(currentUser.id, token);
        setProgressData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [currentUser]);

  // Helper functions for counting different statuses
  const countByStatus = (status) => {
    return progressData.filter((entry) => entry.status === status).length;
  };

  // Get the total number of tasks
  const totalEntries = progressData.length;

  // Calculate the number of tasks in each status
  const completed = countByStatus("completed");
  const inProgress = countByStatus("in_progress");
  const notStarted = countByStatus("not_started");

  // Calculate the completion percentage
  const completionPercentage = totalEntries ? Math.round((completed / totalEntries) * 100) : 0;

  // Data for the status overview (bar chart)
  const statusData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Not Started", value: notStarted },
  ];

  // Data for the progress breakdown (pie chart)
  const pieData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
    { name: "Not Started", value: notStarted },
  ];

  const COLORS = ["#82ca9d", "#8884d8", "#ff7f0e"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Progress Overview */}
      <h1 className="text-3xl font-bold mb-4">Learning Progress Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Courses" value={totalEntries} />
        <StatCard title="Completed" value={completed} />
        <StatCard title="Completion %" value={`${completionPercentage}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Status Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Progress Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={pieData} 
                dataKey="value" 
                nameKey="name"
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course List */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Course Status</h2>
        <div className="space-y-2">
          {progressData.map((course) => (
            <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{course.title}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                course.status === "completed" ? "bg-green-100 text-green-800" :
                course.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {course.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded shadow text-center">
    <div className="text-xl font-semibold">{value}</div>
    <div className="text-gray-500">{title}</div>
  </div>
);

export default ProgressDashboard;
