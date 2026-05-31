import { useState, type FC } from "react";
import { Modal, TextInput, Button, Stack, Group, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAuth } from "../context/AuthContext.tsx";

interface RegisterModalProps {
	opened: boolean;
	onClose: () => void;
	onSwitchToLogin: () => void;
}

export const RegisterModal: FC<RegisterModalProps> = ({
	opened,
	onClose,
	onSwitchToLogin,
}) => {
	const { register } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const form = useForm({
		initialValues: { login: "", password: "", confirmPassword: "" },
		validate: {
			login: (value) => (value.trim().length === 0 ? "Введите логин" : null),
			password: (value) =>
				value.length < 3 ? "Пароль должен быть не менее 3 символов" : null,
			confirmPassword: (value, values) =>
				value !== values.password ? "Пароли не совпадают" : null,
		},
	});

	const handleSubmit = async (values: { login: string; password: string }) => {
		setLoading(true);
		setError("");
		try {
			await register(values.login, values.password);
			onClose();
			form.reset();
		} catch (err) {
			setError("Ошибка входа");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Регистрация" centered>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack gap="md">
					<TextInput label="Логин" {...form.getInputProps("login")} required />
					<TextInput
						label="Пароль"
						type="password"
						{...form.getInputProps("password")}
						required
					/>
					<TextInput
						label="Подтвердите пароль"
						type="password"
						{...form.getInputProps("confirmPassword")}
						required
					/>
					{error && (
						<Text c="red" size="sm">
							{error}
						</Text>
					)}
					<Group justify="space-between" mt="md">
						<Button variant="light" onClick={onSwitchToLogin}>
							Вход
						</Button>
						<Button type="submit" loading={loading}>
							Зарегистрироваться
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};
