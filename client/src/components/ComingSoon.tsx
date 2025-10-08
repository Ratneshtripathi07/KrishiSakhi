"use client";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <h1 className="text-4xl font-bold text-center">{title}</h1>
        <p className="text-center text-xl text-gray-700 mt-4">Features are yet to be developed</p>
      </div>
    </div>
  );
}
