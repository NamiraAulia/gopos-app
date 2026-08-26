// components/ui/InputField.tsx
import React from "react";

export interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightSlot?: React.ReactNode;
}

export const InputField = ({ id, label, type, value, placeholder, icon, onChange, rightSlot }: InputFieldProps) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}</label>
        {rightSlot}
      </div>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="block w-full px-4 pl-12 py-3.5 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium sm:text-sm"
        />
      </div>
    </div>
  );
};