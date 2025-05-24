import { useQuery, useQueryClient } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";
import usetoken from "@/api/usetoken";
import apiClient from "@/api/axios";

const STALE_TIME = 5 * 60 * 1000;
const CACHE_TIME = 30 * 60 * 1000;

const fetchData = async (endpoint, token) => {
  if (!token) throw new Error("No authentication token found");

  const response = await apiClient.get(`${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};
const createQueryConfig = (queryKey, endpoint, options = {}) => {
  const token = usetoken();

  return {
    queryKey,
    queryFn: () => fetchData(endpoint, token),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: 2,
    ...options,
  };
};

export const useFetchBuyers = () => {
  return useQuery(createQueryConfig(["buyer"], "/buyers"));
};
export const useFetchCategory = () => {
  return useQuery(createQueryConfig(["categorys"], "/categorys"));
};
export const useFetchItems = () => {
  return useQuery(createQueryConfig(["items"], "/items"));
};
export const useFetchGoDown = () => {
  return useQuery(createQueryConfig(["godown"], "/godown"));
};
export const useFetchPurchaseRef = () => {
  return useQuery(createQueryConfig(["purchasesref"], "/purchases-ref"));
};

export const useFetchDispatchRef = () => {
  return useQuery(createQueryConfig(["dispatchref"], "/dispatch-ref"));
};
