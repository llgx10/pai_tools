import { columnGroups, groupColorsLight, groupColorsDark } from "../constants/tableConfig";

type ThemeMode = "light" | "dark";

export const getSortedColumns = (
  allKeys: string[],
  visibleColumns: string[],
  themeMode: ThemeMode
) => {
  const groupColors = themeMode === "dark" ? groupColorsDark : groupColorsLight;

  const sorted: any[] = [];
  const used = new Set<string>();

  // 1️⃣ Add grouped columns first
  Object.entries(columnGroups).forEach(([group, keys]) => {
    keys.forEach((key) => {
      if (allKeys.includes(key) && visibleColumns.includes(key)) {
        used.add(key);

        sorted.push({
          title: key,
          dataIndex: key,
          key,
          sorter: true,

          onCell: () => ({
            style: {
              backgroundColor: groupColors[group] || undefined,
              whiteSpace: "normal",
              wordBreak: "break-word",
            },
          }),
        });
      }
    });
  });

  // 2️⃣ Add ungrouped columns
  allKeys.forEach((key) => {
    if (!used.has(key) && visibleColumns.includes(key)) {
      sorted.push({
        title: key,
        dataIndex: key,
        key,
        sorter: true,

        onCell: () => ({
          style: {
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
        }),
      });
    }
  });

  return sorted;
};