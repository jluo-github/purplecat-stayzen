"use client";
import { Input } from "../ui/input";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect, use } from "react";

const NavSearch = () => {
  const searchParams = useSearchParams();
  const searchValue = searchParams.get("search")?.toString();

  const { replace } = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchValue || "");

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    // Update the URL with the new search parameters
    replace(`${pathname}?${params.toString()}`);
  }, 500);

  useEffect(() => {
    setSearch(searchValue || "");
  }, [searchValue]);

  return (
    <Input
      type='text'
      placeholder='Search: '
      className='max-w-xs dark:bg-muted'
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
};
export default NavSearch;