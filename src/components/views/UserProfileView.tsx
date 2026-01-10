import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  ExternalLink,
  Package,
  FileText,
  Microscope,
} from "lucide-react";
import * as api from "../../utils/api";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ActivityCalendar } from "../ui/ActivityCalendar";

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  isOwnProfile: boolean;
  onNavigateToMySubmissions?: () => void;
  isAdminModeActive?: boolean;
}

type OrgRole =
  | "Board President"
  | "Board Treasurer"
  | "Board Secretary"
  | "Board Member"
  | "Volunteer";

interface Profile {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  display_email?: string;
  org_role?: OrgRole;
  active: boolean;
  created_at: string;
}

export function UserProfileView({
  userId,
  onBack,
  isOwnProfile,
  onNavigateToMySubmissions,
  isAdminModeActive,
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedSocialLink, setEditedSocialLink] = useState("");
  const [editedAvatarUrl, setEditedAvatarUrl] = useState("");
  const [editedDisplayEmail, setEditedDisplayEmail] = useState("");
  const [editedOrgRole, setEditedOrgRole] = useState<OrgRole>("Volunteer");
  const [saving, setSaving] = useState(false);

  // Contribution tracking state
  const [stats, setStats] = useState<{
    materials: number;
    articles: number;
    guides: number;
    mius: number;
    total: number;
  } | null>(null);
  const [activity, setActivity] = useState<
    Array<{
      date: string;
      count: number;
      types: string[];
      level: 0 | 1 | 2 | 3 | 4;
    }>
  >([]);
  const [recentContributions, setRecentContributions] = useState<
    Array<{
      type: "material" | "article" | "miu";
      title: string;
      timestamp: string;
      id: string;
    }>
  >([]);
  const [loadingContributions, setLoadingContributions] = useState(true);

  useEffect(() => {
    loadProfile();
    loadContributions();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const fetchedProfile = await api.getUserProfile(userId);
      console.log("[UserProfile] Loaded profile:", fetchedProfile);
      console.log("[UserProfile] Role:", fetchedProfile.role);
      console.log("[UserProfile] isOwnProfile:", isOwnProfile);
      setProfile(fetchedProfile);
      setEditedBio(fetchedProfile.bio || "");
      setEditedSocialLink(fetchedProfile.social_link || "");
      setEditedAvatarUrl(fetchedProfile.avatar_url || "");
      setEditedDisplayEmail(fetchedProfile.display_email || "");
      setEditedOrgRole(fetchedProfile.org_role || "Volunteer");
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadContributions = async () => {
    try {
      setLoadingContributions(true);
      console.log("[UserProfile] Loading contributions for userId:", userId);

      // Debug: Check all articles in DB
      const debugData = await api.debugArticles();
      console.log("[UserProfile] DEBUG - All articles in DB:", debugData);

      const [statsData, activityData, recentData] = await Promise.all([
        api.getUserContributionStats(userId),
        api.getUserActivity(userId),
        api.getUserRecentContributions(userId, 5),
      ]);
      console.log("[UserProfile] Stats data:", statsData);
      console.log("[UserProfile] Activity data:", activityData);
      console.log("[UserProfile] Recent data:", recentData);
      setStats(statsData);
      setActivity(activityData);
      setRecentContributions(recentData);
    } catch (error) {
      console.error("Error loading contributions:", error);
      // Non-critical error, don't show toast
    } finally {
      setLoadingContributions(false);
    }
  };

  const handleBackfill = async () => {
    if (
      !confirm(
        "This will set you as the author of all articles (nested in materials) that don't have an author assigned. Continue?"
      )
    ) {
      return;
    }

    try {
      const result = await api.backfillCreatedBy();
      toast.success(
        `Backfill complete! Updated ${result.articlesUpdated} articles.`
      );
      // Reload contributions
      loadContributions();
    } catch (error) {
      console.error("Error backfilling:", error);
      toast.error("Failed to backfill data");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates: Record<string, any> = {
        bio: editedBio,
        social_link: editedSocialLink,
        avatar_url: editedAvatarUrl,
        display_email: editedDisplayEmail,
      };
      // Only admins can update org_role
      if (isAdminModeActive) {
        updates.org_role = editedOrgRole;
      }
      const updatedProfile = await api.updateUserProfile(userId, updates);
      setProfile(updatedProfile);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedBio(profile?.bio || "");
    setEditedSocialLink(profile?.social_link || "");
    setEditedAvatarUrl(profile?.avatar_url || "");
    setEditedDisplayEmail(profile?.display_email || "");
    setEditedOrgRole(profile?.org_role || "Volunteer");
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#211f1c] dark:border-white mx-auto mb-4"></div>
          <p className="normal">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="icon-box-sm arcade-bg-red arcade-btn-red p-2 mb-6"
        >
          <ArrowLeft size={16} />
        </button>
        <p className="normal">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="icon-box-sm arcade-bg-red arcade-btn-red p-2"
        >
          <ArrowLeft size={16} />
        </button>
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="retro-btn-primary arcade-bg-cyan arcade-btn-cyan px-4 h-9 flex items-center gap-2 text-[13px]"
          >
            <Edit2 size={14} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-[#211f1c] dark:border-white/20 overflow-hidden bg-[#e5e4dc] dark:bg-[#3a3835] flex items-center justify-center shrink-0">
              {(editing ? editedAvatarUrl : profile.avatar_url) ? (
                <img
                  src={editing ? editedAvatarUrl : profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl sm:text-3xl normal">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name and Email */}
            <div className="flex-1 min-w-0">
              <CardTitle className="normal mb-1 wrap-break-word">
                {profile.name}
                {profile.role === "admin" && isAdminModeActive && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded whitespace-nowrap">
                    Admin
                  </span>
                )}
              </CardTitle>
              {profile.display_email && (
                <CardDescription className="text-[11px] sm:text-[13px] break-all">
                  {profile.display_email}
                </CardDescription>
              )}
              {profile.org_role && profile.org_role !== "Volunteer" && (
                <p className="text-[11px] text-waste-science dark:text-waste-science mt-1">
                  {profile.org_role}
                </p>
              )}
              <p className="text-[11px] text-black/50 dark:text-white/50 mt-2">
                Member since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar URL (editing only) */}
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="normal">
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                type="url"
                value={editedAvatarUrl}
                onChange={(e) => setEditedAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="text-[13px]"
              />
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Enter a URL to an image for your profile picture
              </p>
            </div>
          )}

          {/* Display Email (editing only) */}
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="display_email" className="normal">
                Display Email (optional)
              </Label>
              <Input
                id="display_email"
                type="email"
                value={editedDisplayEmail}
                onChange={(e) => setEditedDisplayEmail(e.target.value)}
                placeholder="contact@example.com"
                className="text-[13px]"
              />
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Public contact email (leave blank to hide)
              </p>
            </div>
          )}

          {/* Org Role (admin only) */}
          {editing && isAdminModeActive && (
            <div className="space-y-2">
              <Label htmlFor="org_role" className="normal">
                Organization Role
              </Label>
              <select
                id="org_role"
                value={editedOrgRole}
                onChange={(e) => setEditedOrgRole(e.target.value as OrgRole)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl text-[13px] text-black dark:text-white"
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Board Member">Board Member</option>
                <option value="Board Secretary">Board Secretary</option>
                <option value="Board Treasurer">Board Treasurer</option>
                <option value="Board President">Board President</option>
              </select>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                This user's role in the Wastefull organization
              </p>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="normal">
              Bio
            </Label>
            {editing ? (
              <Textarea
                id="bio"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="text-[13px]"
              />
            ) : (
              <p className="text-[13px] normal whitespace-pre-wrap">
                {profile.bio || (
                  <span className="text-black/50 dark:text-white/50 italic">
                    No bio yet
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Social Link */}
          <div className="space-y-2">
            <Label htmlFor="social_link" className="normal">
              Website / Social Link
            </Label>
            {editing ? (
              <Input
                id="social_link"
                type="url"
                value={editedSocialLink}
                onChange={(e) => setEditedSocialLink(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="text-[13px]"
              />
            ) : profile.social_link ? (
              <a
                href={profile.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                {profile.social_link}
                <ExternalLink size={12} />
              </a>
            ) : (
              <p className="text-[13px] text-black/50 dark:text-white/50 italic">
                No link added
              </p>
            )}
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
              <button
                onClick={handleSave}
                disabled={saving}
                className="retro-btn-primary arcade-bg-green arcade-btn-green px-4 h-9 flex items-center justify-center gap-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="retro-btn-primary arcade-bg-red arcade-btn-red px-4 h-9 flex items-center justify-center gap-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributions Section */}
      <Card className="mt-6 border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="normal">Contributions</CardTitle>
              <CardDescription className="">
                Materials and articles submitted by this user
              </CardDescription>
            </div>
            {isOwnProfile && onNavigateToMySubmissions && (
              <button
                onClick={onNavigateToMySubmissions}
                className="retro-card-button arcade-bg-amber arcade-btn-amber px-4 h-9 text-[13px] w-full sm:w-auto"
              >
                My Submissions
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingContributions ? (
            <p className="text-[13px] text-black/60 dark:text-white/60 italic">
              Loading contributions...
            </p>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="retro-card p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Package
                      size={16}
                      className="text-waste-recycle dark:text-waste-recycle"
                    />
                    <span className="text-2xl font-bold arcade-numbers">
                      {stats.materials}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Materials
                  </p>
                </div>

                <div className="retro-card p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText
                      size={16}
                      className="text-waste-reuse dark:text-waste-reuse"
                    />
                    <span className="text-2xl font-bold arcade-numbers">
                      {stats.articles}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Articles
                  </p>
                </div>

                <div className="retro-card p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FileText
                      size={16}
                      className="text-waste-compost dark:text-waste-compost"
                    />
                    <span className="text-2xl font-bold arcade-numbers">
                      {stats.guides}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Guides
                  </p>
                </div>

                <div className="retro-card p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Microscope
                      size={16}
                      className="text-waste-science dark:text-waste-science"
                    />
                    <span className="text-2xl font-bold arcade-numbers">
                      {stats.mius}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    MIUs
                  </p>
                </div>

                <div className="retro-card p-4 text-center bg-black/5 dark:bg-white/5">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl font-bold arcade-numbers text-waste-compost dark:text-waste-compost">
                      {stats.total}
                    </span>
                  </div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Total
                  </p>
                </div>
              </div>

              {/* Activity Calendar */}
              {activity.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    Activity
                    <span className="text-[11px] font-normal text-black/60 dark:text-white/60">
                      (Last 12 months)
                    </span>
                  </h4>
                  <ActivityCalendar data={activity} />
                </div>
              )}

              {/* Recent Contributions */}
              {recentContributions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Recent Contributions
                  </h4>
                  <div className="space-y-2">
                    {recentContributions.map((contrib, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 retro-card hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="mt-0.5">
                          {contrib.type === "material" && (
                            <Package
                              size={16}
                              className="text-waste-recycle dark:text-waste-recycle"
                            />
                          )}
                          {contrib.type === "article" && (
                            <FileText
                              size={16}
                              className="text-waste-reuse dark:text-waste-reuse"
                            />
                          )}
                          {contrib.type === "miu" && (
                            <Microscope
                              size={16}
                              className="text-waste-science dark:text-waste-science"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">
                            {contrib.title}
                          </p>
                          <p className="text-[11px] text-black/60 dark:text-white/60">
                            {new Date(contrib.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.total === 0 && (
                <div className="text-center py-8">
                  <p className="text-[13px] text-black/60 dark:text-white/60 italic">
                    No contributions yet
                  </p>
                </div>
              )}

              {/* Admin backfill button - DISABLED (uncomment if needed for data recovery)
              {isAdminModeActive && isOwnProfile && (
                <div className="pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
                  <button
                    onClick={handleBackfill}
                    className="retro-btn-primary arcade-bg-amber arcade-btn-amber px-4 h-9 text-[13px] w-full sm:w-auto"
                  >
                    Backfill Article Attributions
                  </button>
                  <p className="text-[11px] text-black/60 dark:text-white/60 mt-2">
                    Sets you as the author for articles without attribution
                  </p>
                </div>
              )}
              */}
            </div>
          ) : (
            <p className="text-[13px] text-black/60 dark:text-white/60 italic">
              Unable to load contribution data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
