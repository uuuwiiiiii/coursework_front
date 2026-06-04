import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface AvailabilityRequest {
    teamGuestId: number;
    teamHostId: number;
    refereeId: number;
    dateTime: string;
    excludeMatchId?: number;
}

export const useMatchAvailability = () => {
    return useMutation({
        mutationFn: async (request: AvailabilityRequest) => {
            const { data } = await axios.post<{ available: boolean }>(
                "api/matches/check-availability",
                request
            );
            return data.available;
        },
    });
};