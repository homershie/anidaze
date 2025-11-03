"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function CountrySelect({
  selectedCountry,
  countryOptions,
}: {
  selectedCountry: string;
  countryOptions: Array<{ group: string; countries: Array<{ code: string; name: string }> }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (country === "") {
      params.delete("country");
    } else {
      params.set("country", country);
    }
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <NativeSelect
      value={selectedCountry}
      onChange={handleChange}
      aria-label="選擇國家/地區"
      className="w-48"
    >
      <NativeSelectOption value="">全部國家</NativeSelectOption>
      {countryOptions.map((group) => (
        <NativeSelectOptGroup key={group.group} label={group.group}>
          {group.countries.map((country) => (
            <NativeSelectOption key={country.code} value={country.code}>
              {country.name}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      ))}
    </NativeSelect>
  );
}

