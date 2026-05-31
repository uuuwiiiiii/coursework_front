import { createRootRoute } from "@tanstack/react-router";
import "./../index.css";
import { AuthProvider } from "../context/AuthContext";
import { AuthenticatedApp } from "../components/AuthenticatedApp.tsx";
import "@mantine/core/styles.css";

export const Route = createRootRoute({
	component: () => (
		<AuthProvider>
			<AuthenticatedApp />
		</AuthProvider>
	),
});
