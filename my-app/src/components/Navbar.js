import { useAuth } from "@/context/AuthContext";
import "./Navbar.css";

export default function Navbar({ title, user }) {
  const { logout } = useAuth();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span>{user?.name}</span>
          <span className="user-id">ID: {user?.idNumber}</span>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
} 