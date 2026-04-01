import { Globe } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "hi", label: "हिंदी", flag: "🇮🇳" },
  { value: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
];

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
      <SelectTrigger className="w-10 h-10 rounded-2xl bg-white/15 border-0 flex items-center justify-center p-0 [&>svg]:hidden">
        <Globe className="w-5 h-5 text-primary-foreground" />
      </SelectTrigger>
      <SelectContent className="min-w-[140px]">
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value} className="text-sm font-medium">
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
