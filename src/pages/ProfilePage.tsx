import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiCamera } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface User {
  email: string;
  name: string;
  role: string;
  phone: string;
  photo: string;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setName(parsedUser.name);
      setPhone(parsedUser.phone || '');
      setEmail(parsedUser.email);
      setPreviewUrl(parsedUser.photo || '/default-profile.png');
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to update user profile
    const updatedUser = {
      ...user,
      name,
      phone,
      email,
      photo: previewUrl,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    alert('Profile updated successfully!');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <motion.div
      className="main-content p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold text-gradient mb-6">Your Profile</h1>
      <div className="glass-card p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <img
              src={previewUrl || '/default-profile.png'}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-2 border-[var(--border-color)] shadow-glow"
            />
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 bg-[var(--button-bg)] text-white p-2 rounded-full cursor-pointer hover:scale-105 transition-transform"
            >
              <FiCamera size={20} />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{user.name}</h2>
          <p className="text-[var(--text-secondary)]">{user.role}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Phone Number</label>
            <input
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="[0-9]{10}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfilePage;