"use client"
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `/product?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {/* Prev */}
      <Link 
        href={createPageURL(page - 1)}
        className={clsx(
          "p-2 rounded-md border",
          page <= 1 ? "pointer-events-none opacity-50 border-gray-100" : "hover:bg-gray-50 border-gray-300"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium px-4">
          Page {page} of {totalPages}
        </span>
      </div>

      {/* Next */}
      <Link 
        href={createPageURL(page + 1)}
        className={clsx(
          "p-2 rounded-md border",
          page >= totalPages ? "pointer-events-none opacity-50 border-gray-100" : "hover:bg-gray-50 border-gray-300"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}