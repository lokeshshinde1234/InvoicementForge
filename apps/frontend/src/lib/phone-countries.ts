export type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
  digits: number;
  placeholder: string;
};

export const phoneCountries: PhoneCountry[] = [
  { code: "IN", name: "India", dialCode: "+91", digits: 10, placeholder: "9876543210" },
  { code: "US", name: "United States", dialCode: "+1", digits: 10, placeholder: "4155550123" },
  { code: "CA", name: "Canada", dialCode: "+1", digits: 10, placeholder: "4165550123" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", digits: 10, placeholder: "7700900123" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", digits: 9, placeholder: "501234567" },
  { code: "SG", name: "Singapore", dialCode: "+65", digits: 8, placeholder: "81234567" },
  { code: "AU", name: "Australia", dialCode: "+61", digits: 9, placeholder: "412345678" },
  { code: "DE", name: "Germany", dialCode: "+49", digits: 10, placeholder: "1512345678" },
];

export function findPhoneCountry(code: string | null | undefined) {
  return phoneCountries.find((country) => country.code === code) ?? phoneCountries[0];
}

export function digitsOnly(value: FormDataEntryValue | string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatPhoneNumber(country: PhoneCountry, digits: string) {
  return digits ? `${country.dialCode} ${digits}` : "";
}

export function phoneValidationMessage(country: PhoneCountry, digits: string) {
  if (!digits) return "";

  return digits.length === country.digits
    ? ""
    : `${country.name} phone numbers must contain ${country.digits} digits.`;
}
