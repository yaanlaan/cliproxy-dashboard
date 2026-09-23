import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import {
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export const AccountModal: React.FC = () => {
  const {
    isAccountModalOpen,
    setIsAccountModalOpen,
    currentUser,
    secretKey,
    updateAdminCredentials,
    addToast,
  } = useApp();
  const { language } = useI18n();

  const [username, setUsername] = useState<string>(currentUser);
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isAccountModalOpen) {
      setUsername(currentUser);
      setChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage("");
      setLoading(false);
    }
  }, [isAccountModalOpen, currentUser]);

  if (!isAccountModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage(language === "zh" ? "用户名不能为空" : "Username cannot be empty");
      return;
    }

    if (changePassword) {
      if (!currentPassword.trim()) {
        setErrorMessage(language === "zh" ? "请输入原管理密码以验证身份" : "Please enter current password");
        return;
      }
      if (currentPassword.trim() !== secretKey) {
        setErrorMessage(language === "zh" ? "原密码不正确，请重新输入" : "Incorrect current password");
        return;
      }
      if (!newPassword.trim()) {
        setErrorMessage(language === "zh" ? "新密码不能为空" : "New password cannot be empty");
        return;
      }
      if (newPassword.trim().length < 4) {
        setErrorMessage(language === "zh" ? "新密码长度至少需要 4 位" : "New password must be at least 4 characters");
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setErrorMessage(language === "zh" ? "两次输入的新密码不一致" : "Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await updateAdminCredentials(
        username.trim(),
        changePassword ? newPassword.trim() : undefined
      );

      if (res.ok) {
        addToast(
          "success",
          language === "zh" ? "管理员账户信息已成功更新" : "Account updated successfully"
        );
        setIsAccountModalOpen(false);
      } else {
        setErrorMessage(res.error || (language === "zh" ? "保存失败" : "Failed to save"));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (language === "zh" ? "更新异常" : "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">
              {language === "zh" ? "修改管理员账户与密码" : "Change Admin Account & Password"}
            </h3>
          </div>
          <button
            onClick={() => setIsAccountModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {language === "zh" ? "管理员用户名 (Username)" : "Admin Username"}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {language === "zh" ? "登录控制台时展示与填写的账号名称" : "Displayed account name when logging in"}
            </p>
          </div>

          {/* Toggle Change Password */}
          <div className="pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
              />
              <span>{language === "zh" ? "同时修改管理密码 (Secret Key)" : "Change Management Secret Key"}</span>
            </label>
          </div>

          {/* Password Fields (Conditional) */}
          {changePassword && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === "zh" ? "当前原密码 (Current Password)" : "Current Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={language === "zh" ? "输入当前原密码验证" : "Enter current password"}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === "zh" ? "新管理密码 (New Password)" : "New Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === "zh" ? "至少 4 位字符" : "At least 4 characters"}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === "zh" ? "确认新密码 (Confirm New Password)" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={language === "zh" ? "再次输入新密码" : "Re-enter new password"}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              {language === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {language === "zh" ? "确认保存修改" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
