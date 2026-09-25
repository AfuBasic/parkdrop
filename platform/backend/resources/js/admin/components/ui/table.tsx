import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
export const Table = ({ className, ...props }: TableProps) => (
  <table className={`w-full caption-bottom text-sm ${className || ''}`} {...props} />
);
export const TableHeader = ({ className, ...props }: TableProps) => (
  <thead className={`[&_tr]:border-b ${className || ''}`} {...props} />
);
export const TableBody = ({ className, ...props }: TableProps) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`} {...props} />
);
export const TableRow = ({ className, ...props }: TableProps) => (
  <tr className={`border-b border-[#E2E8F0] transition-colors hover:bg-[#F8FAFC] ${className || ''}`} {...props} />
);
export const TableHead = ({ className, ...props }: TableProps) => (
  <th className={`h-10 px-4 text-left align-middle font-medium text-[#475569] ${className || ''}`} {...props} />
);
export const TableCell = ({ className, ...props }: TableProps) => (
  <td className={`p-4 align-middle ${className || ''}`} {...props} />
);
