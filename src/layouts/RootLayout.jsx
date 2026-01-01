import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";

export default function RootLayout() {
  const { pathname } = useLocation();
  const hideHeader =
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/app");

  return (
    <>
      {!hideHeader && <Header />}
      <Outlet />
    </>
  );
}
