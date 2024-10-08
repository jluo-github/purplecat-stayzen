import { Label } from "@/components/ui/label";
import { formattedCountries } from "@/utils/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const name = "country";

const CountriesInput = ({ defaultValue }: { defaultValue?: string }) => {
  return (
    <div className='mb-2'>
      <Label htmlFor={name}>Country</Label>

      {/* select */}
      <Select
        defaultValue={defaultValue || formattedCountries[0].code}
        name={name}
        required>
        {/*select trigger */}
        <SelectTrigger id={name} className='dark:border-violet-800'>
          <SelectValue />
        </SelectTrigger>

        {/* content */}
        <SelectContent>
          {formattedCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className='flex items-center gap-4'>
                {country.flag} {country.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default CountriesInput;
