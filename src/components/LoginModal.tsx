import { type FC, useState } from "react";
import { Modal, TextInput, Button, Stack, Group, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "../context/AuthContext.tsx";

interface LoginModalProps {
	opened: boolean;
	onClose: () => void;
	onSwitchToRegister: () => void;
}

export const LoginModal: FC<LoginModalProps> = ({
	opened,
	onClose,
	onSwitchToRegister,
}) => {
	const { login } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const form = useForm({
		initialValues: { login: "", password: "" },
		validate: {
			login: (value) => (value.trim().length === 0 ? "Введите логин" : null),
			password: (value) =>
				value.trim().length === 0 ? "Введите пароль" : null,
		},
	});

	const handleSubmit = async (values: { login: string; password: string }) => {
		setLoading(true);
		setError("");
		try {
			await login(values.login, values.password);
			onClose();
			form.reset();
		} catch (err) {
			setError("Ошибка входа");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Вход" centered>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="md">
					<TextInput label="Логин" {...form.getInputProps("login")} required />
					<TextInput
						label="Пароль"
						type="password"
						{...form.getInputProps("password")}
						required
					/>
					{error && (
						<Text c="red" size="sm">
							{error}
						</Text>
					)}
					<Group justify="space-between" mt="md">
						<Button variant="light" onClick={onSwitchToRegister}>
							Регистрация
						</Button>
						<Button type="submit" loading={loading}>
							Войти
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};
