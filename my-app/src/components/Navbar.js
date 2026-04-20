import "./Navbar.css";
import { useRouter } from "next/navigation";
import toast  from "react-hot-toast";

export default function Navbar({ title, user, onToggleSidebar }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: 'include',
          headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
          throw new Error('Logout failed');
      }

      router.replace('/auth/login');
      toast.success('Logged out successfully');
  } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
  }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span>{user?.name}</span>
          <span className="user-id">ID: {user?.username}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
} 