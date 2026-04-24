import type { Material } from "../../types/material";
import { getTotalArticleCount } from "../../utils/materialArticles";

interface UserObject {
  id: string;
  email: string;
  name?: string;
}

interface WelcomeProps {
  user: UserObject | null;
  materials: Material[];
  onViewProfile: (userId: string) => void;
}

export function Welcome({ user, materials, onViewProfile }: WelcomeProps) {
  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      {/* Beta contributor message */}
      <div className="mb-6 px-4">
        <p className="text-[12px] text-black/60 dark:text-white/60">
          Hi,{" "}
          {user ? (
            <button
              type="button"
              onClick={() => onViewProfile(user.id)}
              className="underline hover:no-underline cursor-pointer transition"
            >
              {user.name || user.email.split("@")[0]}
            </button>
          ) : (
            "human"
          )}
          !
        </p>
        <p className="text-[14px] normal mb-1">
          WasteDB is human-made and needs help from contributors like you.
        </p>
        <p className="text-[12px] text-black/60 dark:text-white/60">
          The database currently has {materials.length} materials and{" "}
          {materials.reduce((sum, m) => sum + getTotalArticleCount(m), 0)}{" "}
          articles.
        </p>
      </div>

      <p className="text-[11px] text-black/50 dark:text-white/50">
        Can&apos;t find a material? Type its name to submit it from search
        suggestions.
      </p>
    </div>
  );
}
