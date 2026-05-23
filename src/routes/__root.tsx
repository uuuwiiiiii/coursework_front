import { createRootRoute } from "@tanstack/react-router";
import "./../index.css";
import {Suspense} from "react";
import {LoadingOverlay} from "@mantine/core";
import Layout from "../components/Layout";

export const Route = createRootRoute({
    component: () => {
        return (
            <div className="app">
                <header className="app-header">
                    <h1>🏀 Баскетбольный Чемпионат</h1>
                </header>
                <div className="app-body">
                    <Suspense fallback={<LoadingOverlay visible={true} />}>
                        <Layout />
                    </Suspense>
                </div>
            </div>
        );
    },
});