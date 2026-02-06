import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUpdateProfile } from "@/hooks/useUserRoles";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuthContext();
  const updateProfile = useUpdateProfile();

  const handleLanguageChange = (lang: "en" | "es") => {
    setLanguage(lang);
    if (user?.id) {
      updateProfile.mutate({ userId: user.id, preferred_language: lang });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={language === "en" ? "bg-accent" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("es")}
          className={language === "es" ? "bg-accent" : ""}
        >
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
