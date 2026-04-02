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
  const currentLang = languages.find((l) => l.value === language);

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
      <SelectTrigger className="h-10 rounded-2xl bg-white/15 border-0 flex items-center gap-1.5 px-2.5 [&>svg]:hidden">
        <Globe className="w-4 h-4 text-primary-foreground" />
        <span className="text-sm text-primary-foreground font-medium">{currentLang?.flag}</span>
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
