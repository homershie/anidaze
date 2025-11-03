"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CountryTags({
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

  const handleCountryClick = (countryCode: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // 使用空字串作為「全部國家」的特殊值
    if (countryCode === "") {
      params.delete("country");
    } else {
      params.set("country", countryCode);
    }

    router.push(`/?${params.toString()}`);
  };

  // 將所有國家展平以便顯示
  const allCountries = countryOptions.flatMap((group) => group.countries);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCountryClick("")}
        className={cn(
          "transition-all",
          selectedCountry === "" &&
            "bg-primary ring-1 ring-primary border-primary"
        )}
      >
        全部國家
      </Button>
      {allCountries.map((country) => (
        <Button
          key={country.code}
          variant="outline"
          size="sm"
          onClick={() => handleCountryClick(country.code)}
          className={cn(
            "transition-all",
            selectedCountry === country.code &&
              "bg-primary ring-1 ring-primary border-primary"
          )}
        >
          {country.name}
        </Button>
      ))}
    </div>
  );
}
