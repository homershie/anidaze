"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CountrySelect({
  selectedCountry,
  countryOptions,
}: {
  selectedCountry: string;
  countryOptions: Array<{
    group: string;
    countries: Array<{ code: string; name: string }>;
  }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // 使用 "all" 作為「全部國家」的特殊值
    if (value === "all") {
      params.delete("country");
    } else {
      params.set("country", value);
    }

    router.push(`/?${params.toString()}`);
  };

  // 將空字串轉換為 "all"，將 "all" 轉換為空字串（用於顯示）
  const selectValue = selectedCountry === "" ? "all" : selectedCountry;

  return (
    <Select value={selectValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-48" aria-label="選擇國家/地區">
        <SelectValue placeholder="全部國家" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部國家</SelectItem>
        {countryOptions.map((group) => (
          <SelectGroup key={group.group}>
            <SelectLabel>{group.group}</SelectLabel>
            {group.countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
