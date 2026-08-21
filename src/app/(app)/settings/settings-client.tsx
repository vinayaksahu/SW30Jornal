'use client';

import * as React from 'react';
import {
  User as UserIcon,
  Sliders,
  Database,
  Download,
  Upload,
  Code2,
  Key,
  Shield,
  Clock,
  Percent,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { updateUserProfile, updateUserSettings } from '@/actions/settings';
import {
  exportFullDatabaseJson,
  exportTradesCsv,
  importFullDatabaseJson,
  syncGithubGist,
} from '@/actions/backup';
import { toast } from 'sonner';

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    timezone: string;
    createdAt: Date | string;
    settings: any | null;
  };
  accounts: { id: string; name: string; propFirm: string }[];
}

export default function SettingsClient({ user, accounts }: SettingsClientProps) {
  const [activeTab, setActiveTab] = React.useState<string>('profile');

  // Profile Form State
  const [profileData, setProfileData] = React.useState({
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Preferences Form State
  const [preferences, setPreferences] = React.useState({
    defaultAccountId: user.settings?.defaultAccountId || accounts[0]?.id || '',
    defaultTimezone: user.settings?.defaultTimezone || user.timezone || 'Asia/Kolkata',
    defaultRisk: user.settings?.defaultRisk ? Number(user.settings.defaultRisk) : 1.0,
    theme: user.settings?.theme || 'dark',
    newsAlerts: user.settings?.newsAlerts ?? true,
    ruleViolationAlerts: user.settings?.ruleViolationAlerts ?? true,
    dailySummary: user.settings?.dailySummary ?? false,
  });
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);

  // GitHub Gist Form State
  const [gistForm, setGistForm] = React.useState({
    token: '',
    gistId: '',
    description: 'SW30 Prop Firm Journal Backup',
    isPublic: false,
  });
  const [isSyncingGist, setIsSyncingGist] = React.useState(false);
  const [gistResult, setGistResult] = React.useState<{ gistId: string; htmlUrl: string } | null>(null);

  // JSON Import State
  const [isImporting, setIsImporting] = React.useState(false);
  const [isExportingJson, setIsExportingJson] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        currentPassword: profileData.currentPassword || undefined,
        newPassword: profileData.newPassword || undefined,
      });
      toast.success('Profile updated successfully!');
      setProfileData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    try {
      await updateUserSettings(preferences);
      toast.success('Preferences saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleExportJson = async () => {
    setIsExportingJson(true);
    try {
      const data = await exportFullDatabaseJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sw30-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Full JSON database backup downloaded!');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const csv = await exportTradesCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sw30-trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Trades exported to CSV successfully!');
    } catch (err: any) {
      toast.error(err.message || 'CSV export failed');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Importing this backup will merge accounts, strategies, and trades into your database. Proceed?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await importFullDatabaseJson(data);
      toast.success(
        `Imported ${res.importedTradesCount} trades, ${res.importedAccounts} accounts, and ${res.importedStrategies} strategies!`
      );
    } catch (err: any) {
      toast.error(err.message || 'Invalid JSON backup file');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSyncGist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gistForm.token) {
      toast.error('Please enter a GitHub Personal Access Token');
      return;
    }

    setIsSyncingGist(true);
    try {
      const res = await syncGithubGist(gistForm);
      setGistResult({ gistId: res.gistId, htmlUrl: res.htmlUrl });
      setGistForm((prev) => ({ ...prev, gistId: res.gistId }));
      toast.success('Synchronized to GitHub Gist successfully!');
    } catch (err: any) {
      toast.error(err.message || 'GitHub Gist sync failed');
    } finally {
      setIsSyncingGist(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Sliders className="h-6 w-6 text-emerald-400" />
          Settings & Backup Center
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account profile, trading preferences, primary timezone, database backups, and GitHub Gist sync.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="profile" className="flex items-center gap-2 text-xs">
            <UserIcon className="h-3.5 w-3.5" />
            Profile & Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 text-xs">
            <Sliders className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 text-xs">
            <Database className="h-3.5 w-3.5" />
            Backup & Export
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Profile & Security */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-emerald-400" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your display name and login credentials.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Display Name</label>
                        <input
                          type="text"
                          required
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Email Address</label>
                        <input
                          type="email"
                          required
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-zinc-500" />
                        Change Password (Optional)
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-300">Current Password</label>
                          <input
                            type="password"
                            placeholder="Required only if setting a new password"
                            value={profileData.currentPassword}
                            onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-300">New Password</label>
                            <input
                              type="password"
                              placeholder="Minimum 6 characters"
                              value={profileData.newPassword}
                              onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-300">Confirm New Password</label>
                            <input
                              type="password"
                              placeholder="Repeat new password"
                              value={profileData.confirmPassword}
                              onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={isSavingProfile} className="gap-2">
                        <Save className="h-4 w-4" />
                        {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Account Info Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">User Role</span>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Member Since</span>
                      <span className="text-zinc-200">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                          day: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Your password is protected using salted bcrypt encryption. All API endpoints and database mutations
                    are authenticated with secure JWT session tokens.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Preferences */}
        <TabsContent value="preferences" className="mt-6">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Journaling & Display Preferences
              </CardTitle>
              <CardDescription>
                Customize default trading account, timezone calculation, and interface alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Default Account */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Default Active Account</label>
                    <select
                      value={preferences.defaultAccountId}
                      onChange={(e) => setPreferences({ ...preferences, defaultAccountId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.propFirm})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-zinc-500">
                      Loaded automatically on Dashboard, Calendar, and OCR trade uploads.
                    </p>
                  </div>

                  {/* Primary Timezone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Primary Display Timezone
                    </label>
                    <select
                      value={preferences.defaultTimezone}
                      onChange={(e) => setPreferences({ ...preferences, defaultTimezone: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30) [Default & Recommended]</option>
                      <option value="Europe/London">Europe/London (GMT/BST - UTC+0/+1)</option>
                      <option value="America/New_York">America/New_York (EST/EDT - UTC-5/-4)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST - UTC+9)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST - UTC+10)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                    </select>
                    <p className="text-[11px] text-zinc-500">
                      Dates are stored in UTC and rendered seamlessly in your preferred timezone.
                    </p>
                  </div>

                  {/* Default Risk % */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-emerald-400" />
                      Default Risk Per Trade (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={preferences.defaultRisk}
                      onChange={(e) =>
                        setPreferences({ ...preferences, defaultRisk: parseFloat(e.target.value) || 1.0 })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Standard risk baseline used for prop firm compliance scoring.
                    </p>
                  </div>

                  {/* News Alerts */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-emerald-400" />
                      Alerts & Notifications
                    </label>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newsAlerts"
                          checked={preferences.newsAlerts}
                          onChange={(e) => setPreferences({ ...preferences, newsAlerts: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="newsAlerts" className="text-xs text-zinc-300 cursor-pointer">
                          Live News Blackout Warning Banners
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="ruleViolationAlerts"
                          checked={preferences.ruleViolationAlerts}
                          onChange={(e) =>
                            setPreferences({ ...preferences, ruleViolationAlerts: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="ruleViolationAlerts" className="text-xs text-zinc-300 cursor-pointer">
                          Prop Firm Rule Violation Alerts
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <Button type="submit" disabled={isSavingPreferences} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Backup & Export Center */}
        <TabsContent value="backup" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JSON Full Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-400" />
                  Full Database Export (JSON)
                </CardTitle>
                <CardDescription>
                  Download a complete backup snapshot of all your accounts, trading strategies, rules, trades, OCR evidence,
                  and news configurations in portable JSON format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleExportJson}
                  disabled={isExportingJson}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Download className="h-4 w-4" />
                  {isExportingJson ? 'Generating Snapshot...' : 'Download Full JSON Backup'}
                </Button>
              </CardContent>
            </Card>

            {/* CSV Trades Export */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                  Export Trades to CSV
                </CardTitle>
                <CardDescription>
                  Download all logged trades formatted for Microsoft Excel, Google Sheets, or custom quantitative data
                  analysis with lot sizes, executions, P/L, and compliance tags.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleExportCsv}
                  disabled={isExportingCsv}
                  variant="outline"
                  className="w-full gap-2 border-teal-500/30 hover:bg-teal-500/10 text-teal-300"
                >
                  <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                  {isExportingCsv ? 'Generating CSV...' : 'Download Trades (CSV)'}
                </Button>
              </CardContent>
            </Card>

            {/* JSON Restore / Import */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-amber-400" />
                  Restore / Import from JSON
                </CardTitle>
                <CardDescription>
                  Upload a previously exported JSON backup to merge historical trades, accounts, rules, and strategies back
                  into your journal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center hover:border-amber-500/50 transition-colors bg-zinc-950/40">
                  <input
                    type="file"
                    id="jsonBackupFile"
                    accept=".json"
                    disabled={isImporting}
                    onChange={handleImportJson}
                    className="hidden"
                  />
                  <label htmlFor="jsonBackupFile" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-amber-400" />
                    <span className="text-xs font-medium text-zinc-200">
                      {isImporting ? 'Importing Snapshot...' : 'Click to select JSON backup file'}
                    </span>
                    <span className="text-[11px] text-zinc-500">Supports .json exports from SW30 Journal</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* GitHub Gist Sync */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-indigo-400" />
                  GitHub Gist Cloud Sync
                </CardTitle>
                <CardDescription>
                  Store your trading journal securely in your private or secret GitHub Gist using your Personal Access
                  Token (PAT).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSyncGist} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">GitHub Personal Access Token (PAT)</label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={gistForm.token}
                      onChange={(e) => setGistForm({ ...gistForm, token: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-zinc-500">Needs "gist" scope permission from GitHub Settings.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Existing Gist ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="Leave empty to create a new Gist"
                      value={gistForm.gistId}
                      onChange={(e) => setGistForm({ ...gistForm, gistId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {gistResult && (
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between text-indigo-300">
                      <span>Sync Successful!</span>
                      <a
                        href={gistResult.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        View Gist <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSyncingGist}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncingGist ? 'animate-spin' : ''}`} />
                    {isSyncingGist ? 'Syncing with GitHub...' : gistForm.gistId ? 'Update Gist' : 'Create & Sync Gist'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
