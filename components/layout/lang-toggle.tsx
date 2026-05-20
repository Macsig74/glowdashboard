"use client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "fr" : "en")}
      className="text-xs font-semibold w-10 px-0"
    >
      {lang === "en" ? "FR" : "EN"}
    </Button>
  );
}
