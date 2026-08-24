import { Search, X } from "lucide-react";

type SupplierSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const SupplierSearchBar = ({
  value,
  onChange,
  placeholder = "Cari nama distributor, nama sales, atau no HP...",
}: SupplierSearchBarProps) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl border-2 border-slate-200 pl-10 pr-9 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 bg-white"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
