import {
    queryOptions,
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import type { Team } from "../types";
import axios from "axios";

export const teamsQueryOptions = queryOptions({
    queryKey: ["teams"],
    queryFn: async () => {
        const { data } = await axios.get<Team[]>("api/teams");
        return data;
    },
    staleTime: Infinity,
});

export const useTeamsQuery = () => {
    return useSuspenseQuery(teamsQueryOptions);
};

export const useTeamMutation = () => {
    const queryClient = useQueryClient();

    const deleteTeam = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`api/teams/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });

    const addTeam = useMutation({
        mutationFn: async (newTeam: Omit<Team, "id">) => {
            const { data } = await axios.post<Team>("api/teams", newTeam);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
        },
    });

    const updateTeam = useMutation({
        mutationFn: async (team: Team) => {
            const { data } = await axios.put<Team>("api/teams", team);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });

    return {
        deleteTeam: deleteTeam.mutate,
        isDeleting: deleteTeam.isPending,
        deleteError: deleteTeam.error,
        addTeam: addTeam.mutate,
        isAdding: addTeam.isPending,
        addError: addTeam.error,
        updateTeam: updateTeam.mutate,
        isUpdating: updateTeam.isPending,
        updateError: updateTeam.error,
    };
};