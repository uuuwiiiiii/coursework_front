import { createFileRoute } from "@tanstack/react-router";
import Cities from "../components/Cities.tsx";

export const Route = createFileRoute("/cities")({
    component: Cities,
});