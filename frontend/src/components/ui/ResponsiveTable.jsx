/**
 * ResponsiveTable Component
 * Displays tabular data as:
 * - Desktop (lg+): Full table
 * - Tablet (sm-lg): Compact table with stacked content
 * - Mobile (< sm): Card view
 */

import { useResponsive } from "../../hooks/useResponsive";

const ResponsiveTable = ({
  columns, // [{ key: 'id', label: 'ID', render: (value) => ... }]
  data = [],
  renderCard, // (item) => React component for card view
  loading = false,
  emptyMessage = "No data available",
  className = "",
}) => {
  const { isMobile, isTablet } = useResponsive();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-500">
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile: Card view
  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, idx) => (
          <div key={item.id || idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {renderCard ? (
              renderCard(item)
            ) : (
              // Default card layout
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {col.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Tablet & Desktop: Table view
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ${
                  col.width || ""
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, idx) => (
            <tr
              key={item.id || idx}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 sm:px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
                    col.className || ""
                  }`}
                >
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;
