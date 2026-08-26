export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/workouts/:path*",
    "/exercises/:path*",
    "/progress/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
