'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronLeft, ChevronRight, ChevronUp, Check } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
  itemLabel = 'items',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      className={`px-3 sm:px-5 py-2.5 sm:py-3 border-t border-[#D9EDEE] bg-white dark:bg-zinc-900 shrink-0 text-xs mt-auto sticky bottom-0 z-20 ${className}`}
      role="navigation"
      aria-label="Pagination Navigation"
    >
      {/* Responsive layout: flex-col on very small screens, flex-row on normal screens */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Showing range — left side */}
        <div className="text-muted-foreground font-medium text-[11px] sm:text-xs whitespace-nowrap self-start sm:self-auto">
          Showing <span className="font-bold text-foreground">{startItem}</span>–
          <span className="font-bold text-foreground">{endItem}</span>{' '}
          <span>of <span className="font-bold text-foreground">{totalItems}</span> {itemLabel}</span>
        </div>

        {/* Controls — right side: rows per page + page nav */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 w-full sm:w-auto">
          {/* Rows Per Page Radix Dropdown — uses Portal to avoid overflow clipping */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium text-[11px] sm:text-xs whitespace-nowrap">
              Per page:
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="group bg-white dark:bg-zinc-900 border border-[#D9EDEE] hover:border-[#0396A6] hover:bg-[#0396A6]/5 hover:shadow-md focus:border-[#0396A6] text-foreground font-bold rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs outline-none cursor-pointer shadow-2xs transition-all duration-200 flex items-center gap-1"
                  aria-label="Rows per page"
                >
                  <span className="transition-colors duration-200 group-hover:text-[#0396A6]">{pageSize}</span>
                  <ChevronUp
                    size={12}
                    className="text-muted-foreground transition-all duration-200 group-hover:text-[#0396A6] group-data-[state=open]:rotate-180 group-hover:translate-y-[-1px]"
                  />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  side="top"
                  align="end"
                  sideOffset={6}
                  collisionPadding={12}
                  className="z-[99999] min-w-[90px] bg-white dark:bg-zinc-900 border border-[#D9EDEE] dark:border-zinc-800 rounded-xl shadow-2xl p-1 animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                  {pageSizeOptions.map((opt) => {
                    const isSelected = pageSize === opt;
                    return (
                      <DropdownMenu.Item
                        key={opt}
                        onClick={() => {
                          onPageSizeChange(opt);
                          onPageChange(1);
                        }}
                        className={`relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer outline-none transition-all duration-200 select-none ${
                          isSelected
                            ? 'bg-[#0396A6]/10 text-[#0396A6] font-bold'
                            : 'text-foreground hover:bg-[#0396A6]/10 hover:text-[#0396A6] hover:translate-x-0.5'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check size={12} className="text-[#0396A6] shrink-0" />}
                      </DropdownMenu.Item>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="w-7 h-7 flex items-center justify-center font-bold text-foreground bg-white dark:bg-zinc-900 border border-[#D9EDEE] rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="font-bold text-foreground px-1.5 text-[11px] sm:text-xs whitespace-nowrap" aria-current="page">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="w-7 h-7 flex items-center justify-center font-bold text-foreground bg-white dark:bg-zinc-900 border border-[#D9EDEE] rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
