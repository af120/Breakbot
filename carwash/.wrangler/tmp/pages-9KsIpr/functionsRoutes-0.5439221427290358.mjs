import { onRequestGet as __api_admin_dashboard_ts_onRequestGet } from "/workspaces/Breakbot/carwash/functions/api/admin/dashboard.ts"
import { onRequestPost as __api_auth_login_ts_onRequestPost } from "/workspaces/Breakbot/carwash/functions/api/auth/login.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "/workspaces/Breakbot/carwash/functions/api/auth/logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "/workspaces/Breakbot/carwash/functions/api/auth/me.ts"
import { onRequestPost as __api_book_ts_onRequestPost } from "/workspaces/Breakbot/carwash/functions/api/book.ts"
import { onRequestPost as __api_setup_ts_onRequestPost } from "/workspaces/Breakbot/carwash/functions/api/setup.ts"
import { onRequest as __api_admin__middleware_ts_onRequest } from "/workspaces/Breakbot/carwash/functions/api/admin/_middleware.ts"
import { onRequest as __api_ping_ts_onRequest } from "/workspaces/Breakbot/carwash/functions/api/ping.ts"

export const routes = [
    {
      routePath: "/api/admin/dashboard",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_dashboard_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/book",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_book_ts_onRequestPost],
    },
  {
      routePath: "/api/setup",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_setup_ts_onRequestPost],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api/admin",
      method: "",
      middlewares: [__api_admin__middleware_ts_onRequest],
      modules: [],
    },
  {
      routePath: "/api/ping",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ping_ts_onRequest],
    },
  ]