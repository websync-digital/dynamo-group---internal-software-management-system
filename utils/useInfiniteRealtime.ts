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
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const pageIndexRef = useRef(0);

  // Use JSON strings to stabilize dependency tracking for complex objects
  const filtersKey = JSON.stringify(filters);
  const searchFieldsKey = JSON.stringify(searchFields);

  const fetchData = useCallback(async (isNextPage: boolean = false) => {
    if (isNextPage) setIsFetchingNextPage(true);
    else setIsLoading(true);

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
    } else {
      console.error('Error fetching data for', table, error);
    }

    if (isNextPage) setIsFetchingNextPage(false);
    else setIsLoading(false);
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
    const channel = supabase.channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData((prev) => {
            const newItem = payload.new as T;
            if (prev.some(item => item.id === newItem.id)) return prev;
            return [newItem, ...prev]; // naive prepend, assume descending order
          });
        } else if (payload.eventType === 'UPDATE') {
          setData((prev) => prev.map(item => item.id === payload.new.id ? payload.new as T : item));
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchData(true);
    }
  }, [isFetchingNextPage, hasNextPage, fetchData]);

  return {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  };
}
