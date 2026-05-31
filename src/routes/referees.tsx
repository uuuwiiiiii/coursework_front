import { createFileRoute } from "@tanstack/react-router";
import Referees from "../components/Referees";

export const Route = createFileRoute("/referees")({
	component: Referees,
});
