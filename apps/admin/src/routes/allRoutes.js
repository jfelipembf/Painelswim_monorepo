import React from "react"
import { Navigate } from "react-router-dom"

// Profile
import UserProfile from "../pages/Authentication/user-profile"


// Authentication related pages
import Login from "../pages/Authentication/Login"
import Logout from "../pages/Authentication/Logout"
import ForgetPwd from "../pages/Authentication/ForgetPassword"

// Inner Authentication
import Login1 from "../pages/AuthenticationInner/Login"
import Recoverpw from "../pages/AuthenticationInner/Recoverpw"
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen"

// Dashboard
import Dashboard from "../pages/Dashboard/index"


// Users
import NewUser from "../pages/Users/new-user"
import UsersList from "../pages/Users/users-list"

// Tenants
import TenantsList from "../pages/Tenants/tenants-list"
import NewTenant from "../pages/Tenants/new-tenant"
import TenantProfile from "../pages/Tenants/TenantProfile"

// Branches
import BranchesList from "../pages/Branches/branches-list"
import NewBranch from "../pages/Branches/new-branch"
import BranchProfile from "../pages/Branches/branch-profile"


//Extra Pages
import PagesBlank from "../pages/Extra Pages/pages-blank";
import Pages404 from "../pages/Extra Pages/pages-404";
import Pages500 from "../pages/Extra Pages/pages-500";

const userRoutes = [
  { path: "/dashboard", component: <Dashboard /> },

  // // //profile
  { path: "/profile", component: <UserProfile /> },

  { path: "/users/new", component: <NewUser /> },
  { path: "/users", component: <UsersList /> },

  { path: "/tenants/new", component: <NewTenant /> },
  { path: "/tenants/:tenantId", component: <TenantProfile /> },
  { path: "/tenants", component: <TenantsList /> },

  { path: "/branches/new", component: <NewBranch /> },
  { path: "/branches/:id", component: <BranchProfile /> },
  { path: "/branches", component: <BranchesList /> },

  { path: "/pages-blank", component: <PagesBlank /> },

  // this route should be at the end of all other routes
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
]

const authRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },

  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },

  // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },
]

export { userRoutes, authRoutes }