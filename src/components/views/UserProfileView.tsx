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
}

interface Profile {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export function UserProfileView({
  userId,
  onBack,
  isOwnProfile,
  onNavigateToMySubmissions,
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [editedSocialLink, setEditedSocialLink] = useState("");
  const [editedAvatarUrl, setEditedAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Contribution tracking state
  const [stats, setStats] = useState<{
    materials: number;
    articles: number;
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
      setProfile(fetchedProfile);
      setEditedBio(fetchedProfile.bio || "");
      setEditedSocialLink(fetchedProfile.social_link || "");
      setEditedAvatarUrl(fetchedProfile.avatar_url || "");
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
      const [statsData, activityData, recentData] = await Promise.all([
        api.getUserContributionStats(userId),
        api.getUserActivity(userId),
        api.getUserRecentContributions(userId, 5),
      ]);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProfile = await api.updateUserProfile(userId, {
        bio: editedBio,
        social_link: editedSocialLink,
        avatar_url: editedAvatarUrl,
      });
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
                {profile.role === "admin" && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded whitespace-nowrap">
                    Admin
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-[13px] break-all">
                {profile.email}
              </CardDescription>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <p className="text-[13px] text-black/60 dark:text-white/60 italic text-center py-8">
                  No contributions yet
                </p>
              )}
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
