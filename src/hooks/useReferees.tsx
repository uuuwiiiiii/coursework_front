import {
    queryOptions,
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";
import axios from "axios";
import type { Referee } from "../types";

export const refereesQueryOptions = queryOptions({
    queryKey: ["referees"],
    queryFn: async () => {
        const { data } = await axios.get<Referee[]>("api/referees");
        return data;
    },
    staleTime: Infinity,
});

export const useRefereesQuery = () => {
    return useSuspenseQuery(refereesQueryOptions);
};

export const useRefereeMutation = () => {
    const queryClient = useQueryClient();

    const deleteReferee = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await axios.delete(`api/referees/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: refereesQueryOptions.queryKey,
            });
        },
    });

    const addReferee = useMutation({
        mutationFn: async (newReferee: Omit<Referee, "id">) => {
            const { data } = await axios.post<Referee>("api/referees", newReferee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: refereesQueryOptions.queryKey,
            });
        },
    });

    const updateReferee = useMutation({
        mutationFn: async (referee: Referee) => {
            const { data } = await axios.put<Referee>("api/referees", referee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: refereesQueryOptions.queryKey,
            });
        },
        onSettled: () => {
            queryClient.refetchQueries({
                queryKey: refereesQueryOptions.queryKey,
            });
        },
    });

    return {
        deleteReferee: deleteReferee.mutate,
        isDeleting: deleteReferee.isPending,
        deleteError: deleteReferee.error,
        addReferee: addReferee.mutate,
        isAdding: addReferee.isPending,
        addError: addReferee.error,
        updateReferee: updateReferee.mutate,
        isUpdating: updateReferee.isPending,
        updateError: updateReferee.error,
    };
};
