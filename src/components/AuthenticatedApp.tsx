import { Suspense, useState } from "react";
import { Button, Group, LoadingOverlay, Text } from "@mantine/core";
import { useAuth } from "../context/AuthContext.tsx";
import { LoginModal } from "./LoginModal.tsx";
import { RegisterModal } from "./RegisterModal.tsx";
import Layout from "./Layout.tsx";

export const AuthenticatedApp = () => {
	const { user, isAuthenticated, logout } = useAuth();
	const [loginOpened, setLoginOpened] = useState(false);
	const [registerOpened, setRegisterOpened] = useState(false);

	return (
		<div className="app">
			<header className="app-header">
				<Group justify="space-between" align="center">
					<h1>Баскетбольный Чемпионат</h1>
					{isAuthenticated ? (
						<Group justify="space-between" align="center">
							<Text size="sm" c="dimmed">
								{user?.login} ({user?.role})
							</Text>
							<Button size="xs" variant="light" onClick={logout}>
								Выйти
							</Button>
						</Group>
					) : (
						<Button size="xs" onClick={() => setLoginOpened(true)}>
							Войти
						</Button>
					)}
				</Group>
			</header>
			<div className="app-body">
				<Suspense fallback={<LoadingOverlay visible={true} />}>
					<Layout />
				</Suspense>
			</div>

			<LoginModal
				opened={loginOpened}
				onClose={() => setLoginOpened(false)}
				onSwitchToRegister={() => {
					setLoginOpened(false);
					setRegisterOpened(true);
				}}
			/>
			<RegisterModal
				opened={registerOpened}
				onClose={() => setRegisterOpened(false)}
				onSwitchToLogin={() => {
					setRegisterOpened(false);
					setLoginOpened(true);
				}}
			/>
		</div>
	);
};
