"use client";

export default function Error({ error, reset }) {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <p className="text-lg font-medium mb-2">This page hit an error</p>
      <p className="text-sm text-gray-400 mb-4">{error?.message || "Something went wrong loading this page."}</p>
      <button onClick={() => reset()} className="bg-accent text-bg font-medium px-4 py-2 rounded-lg text-sm">
        Try again
      </button>
    </div>
  );
}
