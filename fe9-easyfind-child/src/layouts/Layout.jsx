import Header from "../components/NavBar";
import { Outlet } from "react-router-dom";
import ProtectedRoute from "../contexts/ProtectedRoute";

const Layout = () => {
  return (
    <>
         <Header /> {/* Navbar is included once in the Layout */}
      <main>
        <Outlet /> {/* This renders the child route components */}
      </main>
    </>
  );
};

export default Layout;
