import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Search, Info, LogOut } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Report an Issue", path: "/form", icon: FileText },
    { name: "Report Status", path: "/status", icon: Search },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Check if user is logged in (you can replace "user" with "token" or any key you use)
  const isLoggedIn = !!localStorage.getItem("user");
  const showLogout =
    isLoggedIn && ["/form", "/admindashboard"].includes(location.pathname);

  return (
    <header className="bg-black text-white">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              BaseCare: Army Issue Reporting
            </h1>
            <p className="text-gray-400 text-base lg:text-lg font-medium tracking-wide">
              Discipline. Report. Resolve.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group relative px-5 py-2 rounded-full font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-black shadow-md"
                      : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                </div>
              </NavLink>
            ))}

            {/* Show Logout only if user is logged in and on specific paths */}
            {showLogout ? (
              <button
                onClick={handleLogout}
                className="group relative px-5 py-2 rounded-full font-semibold transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </div>
              </button>
            ) : (
              <NavLink
                to="/about"
                className="group relative px-5 py-2 rounded-full font-semibold transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">About Us</span>
                </div>
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
