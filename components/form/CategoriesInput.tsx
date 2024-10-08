import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/utils/categories";
const name = "category";

const CategoriesInput = ({ defaultValue }: { defaultValue?: string }) => {
  return (
    <div className='mb-2'>
      <Label htmlFor={name} className='capitalize'>
        Categories
      </Label>

      <Select
        defaultValue={defaultValue || categories[0].label}
        name={name}
        required>
        {/* triger */}
        <SelectTrigger id={name} className='dark:border-violet-800'>
          <SelectValue />
        </SelectTrigger>

        {/* content */}
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.label} value={category.label}>
              <span className='flex items-center gap-2'>
                <category.icon /> {category.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default CategoriesInput;
