"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ClearSearchButtonProps {
  clearText: string;
}

export function ClearSearchButton({ clearText }: ClearSearchButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("category");
    router.push(`/?${params.toString()}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearSearch}
      className="ml-2"
    >
      <X className="h-4 w-4 mr-1" />
      {clearText}
    </Button>
  );
}
