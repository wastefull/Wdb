import { useState, useEffect } from "react";
import { Users, ChevronDown, X } from "lucide-react";
import * as api from "../../utils/api";
import { logger } from "../../utils/logger";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "staff" | "admin";
}

interface UserSelectorProps {
  /** Currently selected user ID (for "on behalf of" attribution) */
  selectedUserId: string | null;
  /** Callback when user selection changes */
  onSelectUser: (userId: string | null) => void;
  /** Label text to display */
  label?: string;
  /** Whether to show the component (typically only in admin mode) */
  isVisible?: boolean;
}

/**
 * UserSelector - Admin-only component for selecting a user to attribute content to.
 * Used for "Post on behalf of" functionality.
 */
export function UserSelector({
  selectedUserId,
  onSelectUser,
  label = "Post on behalf of",
  isVisible = true,
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isVisible && users.length === 0) {
      loadUsers();
    }
  }, [isVisible]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await api.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      logger.error("Error loading users for UserSelector:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative">
      <label className="text-[13px] text-black dark:text-white mb-1 flex items-center gap-2">
        <Users size={14} />
        {label}
      </label>

      {/* Selected user display / trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[14px] text-left outline-none focus:shadow-[2px_2px_0px_0px_#000000] dark:focus:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all flex items-center justify-between"
        >
          <span
            className={
              selectedUser
                ? "text-black dark:text-white"
                : "text-black/50 dark:text-white/50"
            }
          >
            {loading
              ? "Loading users..."
              : selectedUser
                ? `${selectedUser.name || selectedUser.email} ${selectedUser.role === "admin" ? "(Admin)" : selectedUser.role === "staff" ? "(Staff)" : ""}`
                : "Select a user (optional)"}
          </span>
          <ChevronDown
            size={16}
            className={`text-black/50 dark:text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Clear button */}
        {selectedUserId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectUser(null);
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            title="Clear selection"
          >
            <X size={14} className="text-black/50 dark:text-white/50" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-[#211f1c]/20 dark:border-white/10">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 bg-transparent text-[13px] outline-none placeholder:text-black/40 dark:placeholder:text-white/40"
              autoFocus
            />
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {/* "None" option to clear selection */}
            <button
              type="button"
              onClick={() => {
                onSelectUser(null);
                setIsOpen(false);
                setSearchQuery("");
              }}
              className="w-full px-3 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60 italic"
            >
              — Post as myself (no attribution) —
            </button>

            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelectUser(user.id);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className={`w-full px-3 py-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between ${
                  user.id === selectedUserId
                    ? "bg-waste-recycle/20 dark:bg-waste-recycle/10"
                    : ""
                }`}
              >
                <div>
                  <span className="text-black dark:text-white">
                    {user.name || "Unnamed"}
                  </span>
                  <span className="text-black/50 dark:text-white/50 ml-2">
                    {user.email}
                  </span>
                </div>
                {user.role === "admin" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-waste-science/20 text-waste-science rounded">
                    Admin
                  </span>
                )}
                {user.role === "staff" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-waste-recycle/20 text-waste-recycle rounded">
                    Staff
                  </span>
                )}
              </button>
            ))}

            {filteredUsers.length === 0 && !loading && (
              <div className="px-3 py-4 text-center text-[13px] text-black/50 dark:text-white/50">
                No users found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[11px] text-black/50 dark:text-white/50 mt-1">
        Optional: Attribute this content to another user. The audit log will
        still record you as the admin who performed the action.
      </p>
    </div>
  );
}
