import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { adminAPI } from "@/lib/adminApi";

export default function ProtectedRoute() {
	const [loading, setLoading] = useState(true);
	const [authenticated, setAuthenticated] = useState(false);

	useEffect(() => {
		const verifyAuth = async () => {
			try {
				if (!isAuthenticated()) {
					setAuthenticated(false);
					return;
				}

				// Verify token is still valid on the backend
				try {
					await adminAPI.verifyToken();
					setAuthenticated(true);
				} catch (error) {
					console.error("Token verification failed:", error);
					setAuthenticated(false);
				}
			} finally {
				setLoading(false);
			}
		};

		verifyAuth();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/20">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Verifying authentication...</p>
				</div>
			</div>
		);
	}

	if (!authenticated) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
}
