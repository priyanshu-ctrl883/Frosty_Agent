import React from 'react';

export function TableContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full flex-1 min-h-0 overflow-auto relative bg-white flex flex-col ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <table className={`w-full text-left border-separate border-spacing-0 ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`sticky top-0 z-10 ${className}`}>
      {children}
    </thead>
  );
}

export function TableHead({ 
  children, 
  className = '', 
  align = 'left' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th 
      className={`sticky top-0 z-10 bg-white py-3 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-border/40 text-xs ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ 
  children, 
  className = '', 
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}) {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-[#0396A6]/5 transition-colors ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ 
  children, 
  className = '', 
  align = 'left' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td 
      className={`py-3.5 px-6 border-b border-border/40 ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${className}`}
    >
      {children}
    </td>
  );
}
