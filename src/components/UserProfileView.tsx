import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, X, ExternalLink } from 'lucide-react';
import * as api from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  isOwnProfile: boolean;
}

interface Profile {
  user_id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}

export function UserProfileView({ userId, onBack, isOwnProfile }: UserProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedSocialLink, setEditedSocialLink] = useState('');
  const [editedAvatarUrl, setEditedAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const fetchedProfile = await api.getUserProfile(userId);
      setProfile(fetchedProfile);
      setEditedBio(fetchedProfile.bio || '');
      setEditedSocialLink(fetchedProfile.social_link || '');
      setEditedAvatarUrl(fetchedProfile.avatar_url || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
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
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedBio(profile?.bio || '');
    setEditedSocialLink(profile?.social_link || '');
    setEditedAvatarUrl(profile?.avatar_url || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#211f1c] dark:border-white mx-auto mb-4"></div>
          <p className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-black dark:text-white hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          <span className="font-['Sniglet:Regular',_sans-serif]">Back</span>
        </button>
        <p className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-black dark:text-white hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          <span className="font-['Sniglet:Regular',_sans-serif]">Back</span>
        </button>
        {isOwnProfile && !editing && (
          <Button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-[#b8c8cb] text-black hover:bg-[#a8b8bb] border border-[#211f1c] dark:border-white/20"
          >
            <Edit2 size={14} />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-2 border-[#211f1c] dark:border-white/20 overflow-hidden bg-[#e5e4dc] dark:bg-[#3a3835] flex items-center justify-center">
              {(editing ? editedAvatarUrl : profile.avatar_url) ? (
                <img
                  src={editing ? editedAvatarUrl : profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-['Sniglet:Regular',_sans-serif] text-3xl text-black dark:text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name and Email */}
            <div className="flex-1">
              <CardTitle className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white mb-1">
                {profile.name}
                {profile.role === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    Admin
                  </span>
                )}
              </CardTitle>
              <CardDescription className="font-['Sniglet:Regular',_sans-serif] text-[13px]">
                {profile.email}
              </CardDescription>
              <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50 mt-2">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar URL (editing only) */}
          {editing && (
            <div className="space-y-2">
              <Label htmlFor="avatar_url" className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                type="url"
                value={editedAvatarUrl}
                onChange={(e) => setEditedAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="font-['Sniglet:Regular',_sans-serif] text-[13px]"
              />
              <p className="text-[11px] text-black/60 dark:text-white/60 font-['Sniglet:Regular',_sans-serif]">
                Enter a URL to an image for your profile picture
              </p>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
              Bio
            </Label>
            {editing ? (
              <Textarea
                id="bio"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="font-['Sniglet:Regular',_sans-serif] text-[13px]"
              />
            ) : (
              <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black dark:text-white whitespace-pre-wrap">
                {profile.bio || <span className="text-black/50 dark:text-white/50 italic">No bio yet</span>}
              </p>
            )}
          </div>

          {/* Social Link */}
          <div className="space-y-2">
            <Label htmlFor="social_link" className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
              Website / Social Link
            </Label>
            {editing ? (
              <Input
                id="social_link"
                type="url"
                value={editedSocialLink}
                onChange={(e) => setEditedSocialLink(e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                className="font-['Sniglet:Regular',_sans-serif] text-[13px]"
              />
            ) : (
              profile.social_link ? (
                <a
                  href={profile.social_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-['Sniglet:Regular',_sans-serif] text-[13px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {profile.social_link}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/50 dark:text-white/50 italic">
                  No link added
                </p>
              )
            )}
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex gap-3 pt-4 border-t border-[#211f1c]/20 dark:border-white/20">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#c8e5c8] text-black hover:bg-[#b8d5b8] border border-[#211f1c] dark:border-white/20"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X size={14} />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contributions Section */}
      <Card className="mt-6 border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <CardHeader>
          <CardTitle className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
            Contributions
          </CardTitle>
          <CardDescription className="font-['Sniglet:Regular',_sans-serif]">
            Materials and articles submitted by this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/60 dark:text-white/60 italic">
            Contribution tracking coming in Phase 6.2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
