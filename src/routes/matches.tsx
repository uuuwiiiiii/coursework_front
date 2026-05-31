import { createFileRoute } from "@tanstack/react-router";
import Matches from "../components/Matches";

export const Route = createFileRoute("/matches")({
	component: Matches,
});
