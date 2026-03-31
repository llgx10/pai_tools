import { useMemo } from "react";
import { CHUNK_SIZE } from "../constants/tableConfig";
import type { RowData } from "../types/RowData";

type Props = {
  data: RowData[];
  search: string;
  chunk: number;
};

export const useTableData = ({ data, search, chunk }: Props) => {
  return useMemo(() => {
    const filtered = data.filter((r) =>
      r.__search.includes(search.toLowerCase())
    );

    return filtered.slice(0, chunk * CHUNK_SIZE);
  }, [data, search, chunk]);
};