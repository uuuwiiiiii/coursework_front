import React from 'react';
import ReactDOM from 'react-dom/client';
import {createRouter, RouterProvider} from '@tanstack/react-router';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {routeTree} from "./routeTree.gen.ts"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity
        }
    }
});

const router = createRouter({routeTree});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router}/>
        </QueryClientProvider>
    </React.StrictMode>
)