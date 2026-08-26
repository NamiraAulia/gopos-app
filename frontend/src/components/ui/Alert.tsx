import React from "react";

export interface AlertProps {
  type: "error" | "success";
  message: string;
}

export const Alert = ({ type, message }: AlertProps) => {
  const isError = type === "error";
  return (
    <div
      className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-fade-in border ${
        isError ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
      }`}
    >
      {isError ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-red-500 shrink-0 mt-0.5">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-emerald-500 shrink-0 mt-0.5">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      )}
      <p className={`text-sm font-semibold ${isError ? "text-red-700" : "text-emerald-700"}`}>
        {message}
      </p>
    </div>
  );
};