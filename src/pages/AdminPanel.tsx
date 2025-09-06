import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ErrorBoundary } from 'react-error-boundary';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface User {
  email: string;
  name: string;
  role: string;
}

const ChartErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="text-[var(--icon-bg-red)] p-4 rounded-lg bg-[var(--card-bg)]">
    <p>Error loading chart: {error.message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 btn-primary bg-[var(--icon-bg-indigo)]"
    >
      Retry
    </button>
  </div>
);

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Simulate fetching users
    setUsers([
      { email: 'user1@example.com', name: 'User One', role: 'user' },
      { email: 'user2@example.com', name: 'User Two', role: 'user' },
      { email: 'admin@example.com', name: 'Admin User', role: 'admin' },
    ]);
  }, []);

  if (!user || user.role !== 'admin') {
    return <div className="p-6 text-[var(--icon-bg-red)]">Access Denied: Admin Only</div>;
  }

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bookings',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'var(--icon-bg-indigo)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fill: true,
      },
      {
        label: 'Revenue ($)',
        data: [2800, 3000, 4000, 4200, 3500, 3800],
        borderColor: 'var(--icon-bg-green)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Booking and Revenue Trends', color: 'var(--text-primary)' },
    },
    scales: {
      x: { ticks: { color: 'var(--text-primary)' } },
      y: { ticks: { color: 'var(--text-primary)' } },
    },
  };

  const handleDeleteUser = (email: string) => {
    setUsers(users.filter((u) => u.email !== email));
    alert(`User ${email} deleted`);
  };

  return (
    <motion.div
      className="main-content p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-gradient mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
            <FiTrendingUp className="mr-2" /> Analytics
          </h2>
          <ErrorBoundary FallbackComponent={ChartErrorFallback}>
            <Line data={chartData} options={chartOptions} />
          </ErrorBoundary>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
            <FiUsers className="mr-2" /> User Management
          </h2>
          <div className="modern-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button
                        className="btn-primary bg-[var(--icon-bg-red)]"
                        onClick={() => handleDeleteUser(u.email)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;