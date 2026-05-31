import { createFileRoute } from "@tanstack/react-router";
import Teams from "../components/Teams";

export const Route = createFileRoute("/teams")({
	component: Teams,
});
