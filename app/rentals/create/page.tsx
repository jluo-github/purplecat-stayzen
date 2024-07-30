import FormInput from "@/components/form/FormInput";
import FormContainer from "@/components/form/FormContainer";
import { createPropertyAction } from "@/utils/actions";
import { SubmitButton } from "@/components/form/Buttons";
import CategoriesInput from "@/components/form/CategoriesInput";
import PriceInput from "@/components/form/PriceInput";
import CountriesInput from "@/components/form/CountriesInput";
import ImageInput from "@/components/form/ImageInput";
import CounterInput from "@/components/form/CounterInput";
import { TextAreaInputAuto } from "@/components/form/TextAreaAuto";
import AmenitiesInput from "@/components/form/AmenitiesInput";
import TextareaInput from "@/components/form/TextAreaInput";

const CreatePropertyPage = () => {
  return (
    <>
      <h1 className='mb-8 '>Create Property</h1>
      <div className='border p-8 rounded-lg'>
        <h3 className='mb-8'>General Information</h3>
        <FormContainer action={createPropertyAction}>
          <div className='grid md:grid-cols-2 gap-8 mb-4'>
            {/*form input */}
            <FormInput
              name='name'
              type='text'
              label='Name'
              defaultValue='Cabin in Latvia'
            />
            <FormInput
              name='tagline'
              type='text '
              label='Tagline '
              defaultValue='Stay Calm, StayZen!'
            />
            {/* price */}
            <PriceInput />
            {/* categories */}
            <CategoriesInput />
          </div>
          {/* text area-description */}
          {/* <TextareaInput name='description' labelText='Description' /> */}

          {/* auto expand text area */}
          <TextAreaInputAuto name='description' labelText='Description ' />

          {/* countries input */}
          <div className='grid sm:grid-cols-2 gap-8'>
            <CountriesInput />
            <ImageInput />
          </div>
          {/* counter input */}
          <CounterInput detail='guests' />
          <CounterInput detail='bedrooms' />
          <CounterInput detail='beds' />
          <CounterInput detail='baths' />

          {/* amenities  */}
          <h3 className='my-6'>Amenities</h3>
          <AmenitiesInput />
          {/* button */}
          <SubmitButton text='Create Property' className='my-6' />
        </FormContainer>
      </div>
    </>
  );
};
export default CreatePropertyPage;