import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface InfiniteRealtimeOptions {
  table: string;
  pageSize?: number;
  orderBy?: string;
  orderAscending?: boolean;
  searchFields?: string[];
  searchValue?: string;
  filters?: Record<string, any>;
}

export function useInfiniteRealtime<T extends { id: string }>(options: InfiniteRealtimeOptions) {
  const {
    table,
    pageSize = 50,
    orderBy = 'createdAt',
    orderAscending = false,
    searchFields,
    searchValue,
    filters
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const pageIndexRef = useRef(0);
  const initialFetchDoneRef = useRef(false);

  // Use JSON strings to stabilize dependency tracking for complex objects
  const filtersKey = JSON.stringify(filters);
  const searchFieldsKey = JSON.stringify(searchFields);

  const fetchData = useCallback(async (isNextPage: boolean = false) => {
    if (isNextPage) {
      setIsFetchingNextPage(true);
    } else {
      if (!initialFetchDoneRef.current) {
        setIsInitialLoading(true);
      }
      setIsLoading(true);
    }

    let from = isNextPage ? pageIndexRef.current * pageSize : 0;
    let to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending: orderAscending })
      .range(from, to);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    if (searchFields && searchFields.length > 0 && searchValue) {
      const orQuery = searchFields.map(field => `${field}.ilike.%${searchValue}%`).join(',');
      query = query.or(orQuery);
    }

    const { data: fetchResult, error, count } = await query;

    if (!error && fetchResult) {
      setData((prev) => isNextPage ? [...prev, ...fetchResult as T[]] : fetchResult as T[]);
      if (count !== null) {
        setHasNextPage(to < count - 1);
      } else {
        setHasNextPage(fetchResult.length === pageSize);
      }
      
      if (isNextPage) {
        pageIndexRef.current += 1;
      } else {
        pageIndexRef.current = 1;
      }
      initialFetchDoneRef.current = true;
    } else {
      console.error('Error fetching data for', table, error);
    }

    if (isNextPage) {
      setIsFetchingNextPage(false);
    } else {
      setIsInitialLoading(false);
      setIsLoading(false);
    }
  }, [table, pageSize, orderBy, orderAscending, searchFieldsKey, searchValue, filtersKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    // If we're searching, realtime might act weird if it inserts new items that don't match the search.
    // For simplicity, we just refetch the current page scope or handle basic payload merges. 
    // Usually, strict realtime pushes updates to ID dictionaries, but here we update array directly.
    
    // We only attach channel if we want realtime. For a global refactor, this is yes.
    const channel = supabase.channel(`public:${table}:${filtersKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const currentFilters = filters ? JSON.parse(filtersKey) : null;

        const matchesFilters = (item: any) => {
          if (!currentFilters) return true;
          return Object.entries(currentFilters).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            return item[key] === value;
          });
        };

        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as T;
          if (matchesFilters(newItem)) {
            setData((prev) => {
              if (prev.some(item => item.id === newItem.id)) return prev;
              return [newItem, ...prev];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedItem = payload.new as T;
          if (matchesFilters(updatedItem)) {
            setData((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
          } else {
            // Item no longer matches filters (e.g. moved to another estate), remove it
            setData((prev) => prev.filter(item => item.id !== updatedItem.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filtersKey]);

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchData(true);
    }
  }, [isFetchingNextPage, hasNextPage, fetchData]);

  return {
    data,
    isLoading: isInitialLoading, // Map isInitialLoading to isLoading for legacy compatibility if needed, but better to expose both
    isInitialLoading,
    isRefreshing: isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  };
}
